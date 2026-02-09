/**
 * Reduced Animations Service Tests
 * Comprehensive tests for reduced motion/animations functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as reducedAnimations from '../src/services/reducedAnimations.js';

// Mock localStorage
let mockStorage = {};

// Mock matchMedia
let mockMatchMediaResult = false;
let matchMediaListeners = [];

function createMockMatchMedia(matches) {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((event, listener) => {
      matchMediaListeners.push(listener);
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn((listener) => {
      matchMediaListeners.push(listener);
    }),
    removeListener: vi.fn()
  };
}

beforeEach(() => {
  // Reset mock storage
  mockStorage = {};
  matchMediaListeners = [];
  mockMatchMediaResult = false;

  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    })
  };

  // Mock matchMedia
  global.window = {
    matchMedia: vi.fn((query) => createMockMatchMedia(mockMatchMediaResult))
  };

  // Mock document
  global.document = {
    body: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn((cls) => false)
      }
    },
    head: {
      appendChild: vi.fn()
    },
    createElement: vi.fn((tag) => ({
      id: '',
      textContent: '',
      remove: vi.fn()
    }))
  };

  // Reset service state
  reducedAnimations.resetState();

  // Mock console
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  matchMediaListeners = [];
});

// ============================================
// detectSystemPreference Tests
// ============================================
describe('reducedAnimations - detectSystemPreference', () => {
  it('should return false when system prefers normal motion', () => {
    mockMatchMediaResult = false;
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(false));

    const result = reducedAnimations.detectSystemPreference();
    expect(result).toBe(false);
  });

  it('should return true when system prefers reduced motion', () => {
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(true));

    const result = reducedAnimations.detectSystemPreference();
    expect(result).toBe(true);
  });

  it('should call matchMedia with correct query', () => {
    reducedAnimations.detectSystemPreference();
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should handle missing matchMedia gracefully', () => {
    global.window.matchMedia = undefined;

    const result = reducedAnimations.detectSystemPreference();
    expect(result).toBe(false);
  });

  it('should handle matchMedia errors gracefully', () => {
    global.window.matchMedia = vi.fn(() => {
      throw new Error('matchMedia error');
    });

    const result = reducedAnimations.detectSystemPreference();
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});

// ============================================
// isReducedMotionEnabled Tests
// ============================================
describe('reducedAnimations - isReducedMotionEnabled', () => {
  it('should follow system preference when no user override', () => {
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(true));
    reducedAnimations.resetState();

    const result = reducedAnimations.isReducedMotionEnabled();
    expect(result).toBe(true);
  });

  it('should respect user override when enabled', () => {
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(false));
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.isReducedMotionEnabled();
    expect(result).toBe(true);
  });

  it('should respect user override when disabled', () => {
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(true));
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.isReducedMotionEnabled();
    expect(result).toBe(false);
  });

  it('should return false by default with no system preference', () => {
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(false));
    reducedAnimations.resetState();

    const result = reducedAnimations.isReducedMotionEnabled();
    expect(result).toBe(false);
  });
});

// ============================================
// enableReducedMotion Tests
// ============================================
describe('reducedAnimations - enableReducedMotion', () => {
  it('should enable reduced motion', () => {
    reducedAnimations.enableReducedMotion();

    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);
  });

  it('should save preference to localStorage', () => {
    reducedAnimations.enableReducedMotion();

    expect(localStorage.setItem).toHaveBeenCalledWith('spothitch_reduced_motion', 'true');
  });

  it('should apply reduced motion styles', () => {
    reducedAnimations.enableReducedMotion();

    expect(document.body.classList.add).toHaveBeenCalledWith('reduced-motion');
  });

  it('should notify listeners when state changes', () => {
    reducedAnimations.resetState();
    const listener = vi.fn();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.enableReducedMotion();

    expect(listener).toHaveBeenCalledWith(true);
  });

  it('should not notify listeners if already enabled', () => {
    reducedAnimations.enableReducedMotion();
    const listener = vi.fn();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.enableReducedMotion();

    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle localStorage errors gracefully', () => {
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    expect(() => reducedAnimations.enableReducedMotion()).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });
});

// ============================================
// disableReducedMotion Tests
// ============================================
describe('reducedAnimations - disableReducedMotion', () => {
  it('should disable reduced motion', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.disableReducedMotion();

    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);
  });

  it('should save preference to localStorage', () => {
    reducedAnimations.disableReducedMotion();

    expect(localStorage.setItem).toHaveBeenCalledWith('spothitch_reduced_motion', 'false');
  });

  it('should remove reduced motion styles', () => {
    reducedAnimations.disableReducedMotion();

    expect(document.body.classList.remove).toHaveBeenCalledWith('reduced-motion');
  });

  it('should notify listeners when state changes', () => {
    reducedAnimations.enableReducedMotion();
    const listener = vi.fn();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.disableReducedMotion();

    expect(listener).toHaveBeenCalledWith(false);
  });

  it('should not notify listeners if already disabled', () => {
    reducedAnimations.resetState();
    const listener = vi.fn();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.disableReducedMotion();

    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle localStorage errors gracefully', () => {
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    expect(() => reducedAnimations.disableReducedMotion()).not.toThrow();
  });
});

// ============================================
// toggleReducedMotion Tests
// ============================================
describe('reducedAnimations - toggleReducedMotion', () => {
  it('should toggle from disabled to enabled', () => {
    reducedAnimations.resetState();

    const result = reducedAnimations.toggleReducedMotion();

    expect(result).toBe(true);
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);
  });

  it('should toggle from enabled to disabled', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.toggleReducedMotion();

    expect(result).toBe(false);
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);
  });

  it('should return the new state', () => {
    reducedAnimations.resetState();

    const firstToggle = reducedAnimations.toggleReducedMotion();
    const secondToggle = reducedAnimations.toggleReducedMotion();

    expect(firstToggle).toBe(true);
    expect(secondToggle).toBe(false);
  });

  it('should update localStorage on toggle', () => {
    reducedAnimations.resetState();
    reducedAnimations.toggleReducedMotion();

    expect(localStorage.setItem).toHaveBeenCalled();
  });
});

// ============================================
// syncWithSystemPreference Tests
// ============================================
describe('reducedAnimations - syncWithSystemPreference', () => {
  it('should remove user override', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.syncWithSystemPreference();

    expect(reducedAnimations.hasUserOverride()).toBe(false);
  });

  it('should remove preference from localStorage', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.syncWithSystemPreference();

    expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_reduced_motion');
  });

  it('should follow system preference after sync', () => {
    reducedAnimations.enableReducedMotion();
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(false));

    reducedAnimations.syncWithSystemPreference();

    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);
  });

  it('should apply styles if system prefers reduced motion', () => {
    reducedAnimations.disableReducedMotion();
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(true));

    reducedAnimations.syncWithSystemPreference();

    expect(document.body.classList.add).toHaveBeenCalledWith('reduced-motion');
  });

  it('should notify listeners if state changes', () => {
    reducedAnimations.enableReducedMotion();
    global.window.matchMedia = vi.fn(() => createMockMatchMedia(false));
    const listener = vi.fn();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.syncWithSystemPreference();

    expect(listener).toHaveBeenCalledWith(false);
  });
});

// ============================================
// getAnimationDuration Tests
// ============================================
describe('reducedAnimations - getAnimationDuration', () => {
  it('should return 0 when reduced motion is enabled', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getAnimationDuration(300);

    expect(result).toBe(0);
  });

  it('should return default when reduced motion is disabled', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getAnimationDuration(300);

    expect(result).toBe(300);
  });

  it('should use default value of 300 when no argument provided', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getAnimationDuration();

    expect(result).toBe(300);
  });

  it('should handle invalid input gracefully', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getAnimationDuration('invalid');

    expect(result).toBe(300);
  });

  it('should handle negative values gracefully', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getAnimationDuration(-100);

    expect(result).toBe(300);
  });

  it('should return 0 for large durations when reduced motion enabled', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getAnimationDuration(5000);

    expect(result).toBe(0);
  });
});

// ============================================
// getTransitionClass Tests
// ============================================
describe('reducedAnimations - getTransitionClass', () => {
  it('should return transition-none when reduced motion is enabled', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getTransitionClass('transition-all');

    expect(result).toBe('transition-none');
  });

  it('should return default class when reduced motion is disabled', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getTransitionClass('transition-all');

    expect(result).toBe('transition-all');
  });

  it('should use default class when no argument provided', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getTransitionClass();

    expect(result).toBe('transition-all');
  });

  it('should handle non-string input gracefully', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getTransitionClass(123);

    expect(result).toBe('transition-all');
  });

  it('should handle custom transition classes', () => {
    reducedAnimations.disableReducedMotion();

    const result = reducedAnimations.getTransitionClass('transition-opacity duration-500');

    expect(result).toBe('transition-opacity duration-500');
  });
});

// ============================================
// shouldAnimate Tests
// ============================================
describe('reducedAnimations - shouldAnimate', () => {
  it('should return false when reduced motion is enabled', () => {
    reducedAnimations.enableReducedMotion();

    expect(reducedAnimations.shouldAnimate()).toBe(false);
  });

  it('should return true when reduced motion is disabled', () => {
    reducedAnimations.disableReducedMotion();

    expect(reducedAnimations.shouldAnimate()).toBe(true);
  });

  it('should return opposite of isReducedMotionEnabled', () => {
    reducedAnimations.enableReducedMotion();
    expect(reducedAnimations.shouldAnimate()).toBe(!reducedAnimations.isReducedMotionEnabled());

    reducedAnimations.disableReducedMotion();
    expect(reducedAnimations.shouldAnimate()).toBe(!reducedAnimations.isReducedMotionEnabled());
  });
});

// ============================================
// applyReducedMotionStyles Tests
// ============================================
describe('reducedAnimations - applyReducedMotionStyles', () => {
  it('should add reduced-motion class to body', () => {
    reducedAnimations.applyReducedMotionStyles();

    expect(document.body.classList.add).toHaveBeenCalledWith('reduced-motion');
  });

  it('should create style element', () => {
    reducedAnimations.applyReducedMotionStyles();

    expect(document.createElement).toHaveBeenCalledWith('style');
  });

  it('should handle missing document gracefully', () => {
    const originalDocument = global.document;
    global.document = undefined;

    expect(() => reducedAnimations.applyReducedMotionStyles()).not.toThrow();

    global.document = originalDocument;
  });

  it('should handle missing body gracefully', () => {
    const originalBody = document.body;
    document.body = null;

    expect(() => reducedAnimations.applyReducedMotionStyles()).not.toThrow();

    document.body = originalBody;
  });
});

// ============================================
// removeReducedMotionStyles Tests
// ============================================
describe('reducedAnimations - removeReducedMotionStyles', () => {
  it('should remove reduced-motion class from body', () => {
    reducedAnimations.removeReducedMotionStyles();

    expect(document.body.classList.remove).toHaveBeenCalledWith('reduced-motion');
  });

  it('should handle missing document gracefully', () => {
    const originalDocument = global.document;
    global.document = undefined;

    expect(() => reducedAnimations.removeReducedMotionStyles()).not.toThrow();

    global.document = originalDocument;
  });

  it('should handle missing body gracefully', () => {
    const originalBody = document.body;
    document.body = null;

    expect(() => reducedAnimations.removeReducedMotionStyles()).not.toThrow();

    document.body = originalBody;
  });
});

// ============================================
// onReducedMotionChange Tests
// ============================================
describe('reducedAnimations - onReducedMotionChange', () => {
  it('should register a callback', () => {
    const callback = vi.fn();

    const result = reducedAnimations.onReducedMotionChange(callback);

    expect(result).toBe(true);
  });

  it('should call callback when state changes', () => {
    reducedAnimations.resetState();
    const callback = vi.fn();
    reducedAnimations.onReducedMotionChange(callback);

    reducedAnimations.enableReducedMotion();

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('should not register non-function callbacks', () => {
    const result = reducedAnimations.onReducedMotionChange('not a function');

    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should not register duplicate callbacks', () => {
    reducedAnimations.resetState();
    const callback = vi.fn();
    reducedAnimations.onReducedMotionChange(callback);
    reducedAnimations.onReducedMotionChange(callback);

    reducedAnimations.enableReducedMotion();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should support multiple different callbacks', () => {
    reducedAnimations.resetState();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    reducedAnimations.onReducedMotionChange(callback1);
    reducedAnimations.onReducedMotionChange(callback2);

    reducedAnimations.enableReducedMotion();

    expect(callback1).toHaveBeenCalledWith(true);
    expect(callback2).toHaveBeenCalledWith(true);
  });
});

// ============================================
// offReducedMotionChange Tests
// ============================================
describe('reducedAnimations - offReducedMotionChange', () => {
  it('should unregister a callback', () => {
    const callback = vi.fn();
    reducedAnimations.onReducedMotionChange(callback);

    const result = reducedAnimations.offReducedMotionChange(callback);

    expect(result).toBe(true);
  });

  it('should not call unregistered callback', () => {
    const callback = vi.fn();
    reducedAnimations.onReducedMotionChange(callback);
    reducedAnimations.offReducedMotionChange(callback);
    reducedAnimations.resetState();

    reducedAnimations.enableReducedMotion();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should return false for non-registered callbacks', () => {
    const callback = vi.fn();

    const result = reducedAnimations.offReducedMotionChange(callback);

    expect(result).toBe(false);
  });

  it('should return false for non-function arguments', () => {
    const result = reducedAnimations.offReducedMotionChange('not a function');

    expect(result).toBe(false);
  });

  it('should only remove the specified callback', () => {
    reducedAnimations.resetState();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    reducedAnimations.onReducedMotionChange(callback1);
    reducedAnimations.onReducedMotionChange(callback2);
    reducedAnimations.offReducedMotionChange(callback1);

    reducedAnimations.enableReducedMotion();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith(true);
  });
});

// ============================================
// renderReducedMotionToggle Tests
// ============================================
describe('reducedAnimations - renderReducedMotionToggle', () => {
  it('should return HTML string', () => {
    const result = reducedAnimations.renderReducedMotionToggle();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include toggle button', () => {
    const result = reducedAnimations.renderReducedMotionToggle();

    expect(result).toContain('role="switch"');
    expect(result).toContain('button');
  });

  it('should include aria-checked attribute', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.renderReducedMotionToggle();

    expect(result).toContain('aria-checked="true"');
  });

  it('should include label in French by default', () => {
    const result = reducedAnimations.renderReducedMotionToggle();

    expect(result).toContain('Reduire les animations');
  });

  it('should include label in English when specified', () => {
    const result = reducedAnimations.renderReducedMotionToggle('en');

    expect(result).toContain('Reduce animations');
  });

  it('should include label in Spanish when specified', () => {
    const result = reducedAnimations.renderReducedMotionToggle('es');

    expect(result).toContain('Reducir animaciones');
  });

  it('should include label in German when specified', () => {
    const result = reducedAnimations.renderReducedMotionToggle('de');

    expect(result).toContain('Animationen reduzieren');
  });

  it('should include description text', () => {
    const result = reducedAnimations.renderReducedMotionToggle('fr');

    expect(result).toContain('experience plus calme');
  });

  it('should include onclick handler', () => {
    const result = reducedAnimations.renderReducedMotionToggle();

    expect(result).toContain('onclick=');
    expect(result).toContain('toggleReducedMotion');
  });

  it('should fallback to French for unknown language', () => {
    const result = reducedAnimations.renderReducedMotionToggle('xyz');

    expect(result).toContain('Reduire les animations');
  });
});

// ============================================
// getReducedMotionLabel Tests
// ============================================
describe('reducedAnimations - getReducedMotionLabel', () => {
  it('should return French label by default', () => {
    const result = reducedAnimations.getReducedMotionLabel();

    expect(result).toBe('Reduire les animations');
  });

  it('should return English label', () => {
    const result = reducedAnimations.getReducedMotionLabel('en');

    expect(result).toBe('Reduce animations');
  });

  it('should return Spanish label', () => {
    const result = reducedAnimations.getReducedMotionLabel('es');

    expect(result).toBe('Reducir animaciones');
  });

  it('should return German label', () => {
    const result = reducedAnimations.getReducedMotionLabel('de');

    expect(result).toBe('Animationen reduzieren');
  });

  it('should fallback to French for unknown language', () => {
    const result = reducedAnimations.getReducedMotionLabel('jp');

    expect(result).toBe('Reduire les animations');
  });
});

// ============================================
// getReducedMotionDescription Tests
// ============================================
describe('reducedAnimations - getReducedMotionDescription', () => {
  it('should return French description by default', () => {
    const result = reducedAnimations.getReducedMotionDescription();

    expect(result).toContain('Desactive les animations');
  });

  it('should return English description', () => {
    const result = reducedAnimations.getReducedMotionDescription('en');

    expect(result).toContain('Disable animations');
  });

  it('should return Spanish description', () => {
    const result = reducedAnimations.getReducedMotionDescription('es');

    expect(result).toContain('Desactiva las animaciones');
  });

  it('should return German description', () => {
    const result = reducedAnimations.getReducedMotionDescription('de');

    expect(result).toContain('Deaktiviert Animationen');
  });
});

// ============================================
// getReducedMotionTranslations Tests
// ============================================
describe('reducedAnimations - getReducedMotionTranslations', () => {
  it('should return all French translations by default', () => {
    const result = reducedAnimations.getReducedMotionTranslations();

    expect(result.label).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.enabled).toBeDefined();
    expect(result.disabled).toBeDefined();
    expect(result.autoLabel).toBeDefined();
    expect(result.manualLabel).toBeDefined();
  });

  it('should return all English translations', () => {
    const result = reducedAnimations.getReducedMotionTranslations('en');

    expect(result.label).toBe('Reduce animations');
    expect(result.enabled).toBe('Reduced animations enabled');
    expect(result.disabled).toBe('Normal animations');
  });

  it('should return a copy of translations object', () => {
    const result1 = reducedAnimations.getReducedMotionTranslations('fr');
    const result2 = reducedAnimations.getReducedMotionTranslations('fr');

    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });

  it('should fallback to French for unknown language', () => {
    const result = reducedAnimations.getReducedMotionTranslations('xyz');
    const french = reducedAnimations.getReducedMotionTranslations('fr');

    expect(result).toEqual(french);
  });
});

// ============================================
// getReducedMotionStatus Tests
// ============================================
describe('reducedAnimations - getReducedMotionStatus', () => {
  it('should return status object with all properties', () => {
    const result = reducedAnimations.getReducedMotionStatus();

    expect(result).toHaveProperty('enabled');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('userOverride');
    expect(result).toHaveProperty('systemPreference');
  });

  it('should indicate source as system when no override', () => {
    reducedAnimations.resetState();

    const result = reducedAnimations.getReducedMotionStatus();

    expect(result.source).toBe('system');
  });

  it('should indicate source as user when override is set', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getReducedMotionStatus();

    expect(result.source).toBe('user');
  });

  it('should report correct enabled state', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getReducedMotionStatus();

    expect(result.enabled).toBe(true);
  });

  it('should report user override value', () => {
    reducedAnimations.enableReducedMotion();

    const result = reducedAnimations.getReducedMotionStatus();

    expect(result.userOverride).toBe(true);
  });
});

// ============================================
// hasUserOverride Tests
// ============================================
describe('reducedAnimations - hasUserOverride', () => {
  it('should return false when no override is set', () => {
    reducedAnimations.resetState();

    expect(reducedAnimations.hasUserOverride()).toBe(false);
  });

  it('should return true when enable override is set', () => {
    reducedAnimations.enableReducedMotion();

    expect(reducedAnimations.hasUserOverride()).toBe(true);
  });

  it('should return true when disable override is set', () => {
    reducedAnimations.disableReducedMotion();

    expect(reducedAnimations.hasUserOverride()).toBe(true);
  });

  it('should return false after sync with system', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.syncWithSystemPreference();

    expect(reducedAnimations.hasUserOverride()).toBe(false);
  });
});

// ============================================
// clearListeners Tests
// ============================================
describe('reducedAnimations - clearListeners', () => {
  it('should remove all registered listeners', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    reducedAnimations.onReducedMotionChange(callback1);
    reducedAnimations.onReducedMotionChange(callback2);

    reducedAnimations.clearListeners();
    reducedAnimations.resetState();
    reducedAnimations.enableReducedMotion();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});

// ============================================
// resetState Tests
// ============================================
describe('reducedAnimations - resetState', () => {
  it('should clear user override', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.resetState();

    expect(reducedAnimations.hasUserOverride()).toBe(false);
  });

  it('should clear all listeners', () => {
    const callback = vi.fn();
    reducedAnimations.onReducedMotionChange(callback);
    reducedAnimations.resetState();

    reducedAnimations.enableReducedMotion();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should remove styles from body', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.resetState();

    expect(document.body.classList.remove).toHaveBeenCalledWith('reduced-motion');
  });

  it('should remove preference from localStorage', () => {
    reducedAnimations.enableReducedMotion();
    reducedAnimations.resetState();

    expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_reduced_motion');
  });
});

// ============================================
// getReducedMotionClass Tests
// ============================================
describe('reducedAnimations - getReducedMotionClass', () => {
  it('should return the CSS class name', () => {
    const result = reducedAnimations.getReducedMotionClass();

    expect(result).toBe('reduced-motion');
  });
});

// ============================================
// getStorageKey Tests
// ============================================
describe('reducedAnimations - getStorageKey', () => {
  it('should return the localStorage key', () => {
    const result = reducedAnimations.getStorageKey();

    expect(result).toBe('spothitch_reduced_motion');
  });
});

// ============================================
// Default Export Tests
// ============================================
describe('reducedAnimations - default export', () => {
  it('should export all functions', () => {
    const defaultExport = reducedAnimations.default;

    expect(defaultExport.isReducedMotionEnabled).toBeDefined();
    expect(defaultExport.enableReducedMotion).toBeDefined();
    expect(defaultExport.disableReducedMotion).toBeDefined();
    expect(defaultExport.toggleReducedMotion).toBeDefined();
    expect(defaultExport.detectSystemPreference).toBeDefined();
    expect(defaultExport.syncWithSystemPreference).toBeDefined();
    expect(defaultExport.getAnimationDuration).toBeDefined();
    expect(defaultExport.getTransitionClass).toBeDefined();
    expect(defaultExport.shouldAnimate).toBeDefined();
    expect(defaultExport.applyReducedMotionStyles).toBeDefined();
    expect(defaultExport.removeReducedMotionStyles).toBeDefined();
    expect(defaultExport.onReducedMotionChange).toBeDefined();
    expect(defaultExport.offReducedMotionChange).toBeDefined();
    expect(defaultExport.renderReducedMotionToggle).toBeDefined();
    expect(defaultExport.getReducedMotionLabel).toBeDefined();
  });

  it('should have callable functions in default export', () => {
    const defaultExport = reducedAnimations.default;

    expect(typeof defaultExport.isReducedMotionEnabled).toBe('function');
    expect(typeof defaultExport.toggleReducedMotion).toBe('function');
    expect(typeof defaultExport.getAnimationDuration).toBe('function');
  });
});

// ============================================
// Integration Tests
// ============================================
describe('reducedAnimations - Integration Tests', () => {
  it('should complete full enable/disable cycle', () => {
    reducedAnimations.resetState();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);

    reducedAnimations.enableReducedMotion();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);
    expect(document.body.classList.add).toHaveBeenCalledWith('reduced-motion');

    reducedAnimations.disableReducedMotion();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);
    expect(document.body.classList.remove).toHaveBeenCalledWith('reduced-motion');
  });

  it('should handle multiple toggles correctly', () => {
    reducedAnimations.resetState();

    reducedAnimations.toggleReducedMotion();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);

    reducedAnimations.toggleReducedMotion();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);

    reducedAnimations.toggleReducedMotion();
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);
  });

  it('should maintain consistency across all getter functions', () => {
    reducedAnimations.enableReducedMotion();

    expect(reducedAnimations.isReducedMotionEnabled()).toBe(true);
    expect(reducedAnimations.shouldAnimate()).toBe(false);
    expect(reducedAnimations.getAnimationDuration(300)).toBe(0);
    expect(reducedAnimations.getTransitionClass('test')).toBe('transition-none');
    expect(reducedAnimations.getReducedMotionStatus().enabled).toBe(true);
  });

  it('should notify listeners on all state changes', () => {
    const listener = vi.fn();
    reducedAnimations.resetState();
    reducedAnimations.onReducedMotionChange(listener);

    reducedAnimations.enableReducedMotion();
    expect(listener).toHaveBeenLastCalledWith(true);

    reducedAnimations.disableReducedMotion();
    expect(listener).toHaveBeenLastCalledWith(false);

    reducedAnimations.toggleReducedMotion();
    expect(listener).toHaveBeenLastCalledWith(true);
  });

  it('should work with animation duration in conditionals', () => {
    reducedAnimations.disableReducedMotion();
    const normalDuration = reducedAnimations.getAnimationDuration(500);

    reducedAnimations.enableReducedMotion();
    const reducedDuration = reducedAnimations.getAnimationDuration(500);

    expect(normalDuration).toBe(500);
    expect(reducedDuration).toBe(0);
  });

  it('should persist preference across resets when using localStorage', () => {
    reducedAnimations.enableReducedMotion();
    expect(mockStorage['spothitch_reduced_motion']).toBe('true');

    reducedAnimations.disableReducedMotion();
    expect(mockStorage['spothitch_reduced_motion']).toBe('false');

    reducedAnimations.syncWithSystemPreference();
    expect(mockStorage['spothitch_reduced_motion']).toBeUndefined();
  });
});

// ============================================
// Edge Cases and Error Handling Tests
// ============================================
describe('reducedAnimations - Edge Cases', () => {
  it('should handle rapid toggle calls', () => {
    for (let i = 0; i < 10; i++) {
      reducedAnimations.toggleReducedMotion();
    }

    // After 10 toggles, should be back to original state
    expect(reducedAnimations.isReducedMotionEnabled()).toBe(false);
  });

  it('should handle listener throwing error', () => {
    reducedAnimations.resetState();
    const badListener = vi.fn(() => {
      throw new Error('Listener error');
    });
    const goodListener = vi.fn();

    reducedAnimations.onReducedMotionChange(badListener);
    reducedAnimations.onReducedMotionChange(goodListener);

    reducedAnimations.enableReducedMotion();

    expect(goodListener).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle undefined window gracefully', () => {
    const originalWindow = global.window;
    global.window = undefined;

    expect(() => reducedAnimations.detectSystemPreference()).not.toThrow();
    expect(reducedAnimations.detectSystemPreference()).toBe(false);

    global.window = originalWindow;
  });

  it('should handle null callback registration', () => {
    const result = reducedAnimations.onReducedMotionChange(null);

    expect(result).toBe(false);
  });

  it('should handle undefined callback unregistration', () => {
    const result = reducedAnimations.offReducedMotionChange(undefined);

    expect(result).toBe(false);
  });
});
