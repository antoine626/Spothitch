/**
 * Data Saver Service Tests
 * Tests for data consumption reduction functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enableDataSaver,
  disableDataSaver,
  isDataSaverEnabled,
  getDataSaverSettings,
  updateDataSaverSettings,
  setImageQuality,
  getImageQualityConfig,
  getCurrentImageQuality,
  getOptimizedImageUrl,
  shouldPreload,
  getPollingInterval,
  recordCompressedRequest,
  getDataSavings,
  resetDataSavings,
  renderDataSaverToggle,
  renderSavingsIndicator,
  checkDataSaverSupport,
  detectSaveDataPreference,
  getNetworkInfo,
  autoEnableBasedOnNetwork,
  getImageQualityLevels,
} from '../src/services/dataSaver.js';

describe('Data Saver Service', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    // Reset data savings
    resetDataSavings();
    // Disable data saver
    disableDataSaver();
  });

  afterEach(() => {
    // Clean up any style elements
    const styleEl = document.getElementById('data-saver-styles');
    if (styleEl) {
      styleEl.remove();
    }
  });

  describe('enableDataSaver', () => {
    it('should enable data saver mode', () => {
      const result = enableDataSaver();

      expect(result.enabled).toBe(true);
      expect(isDataSaverEnabled()).toBe(true);
    });

    it('should set default options when enabling', () => {
      const result = enableDataSaver();

      expect(result.imageQuality).toBe('medium');
      expect(result.disableHDImages).toBe(true);
      expect(result.limitPreload).toBe(true);
      expect(result.compressRequests).toBe(true);
    });

    it('should accept custom options', () => {
      const result = enableDataSaver({
        imageQuality: 'low',
        disableAnimations: true,
      });

      expect(result.imageQuality).toBe('low');
      expect(result.disableAnimations).toBe(true);
    });

    it('should persist settings to localStorage', () => {
      enableDataSaver();

      const stored = JSON.parse(localStorage.getItem('spothitch_v4_dataSaver'));
      expect(stored.enabled).toBe(true);
    });

    it('should enable data saver mode', () => {
      enableDataSaver();
      expect(isDataSaverEnabled()).toBe(true);
    });
  });

  describe('disableDataSaver', () => {
    it('should disable data saver mode', () => {
      enableDataSaver();

      const result = disableDataSaver();

      expect(result.enabled).toBe(false);
      expect(isDataSaverEnabled()).toBe(false);
    });

    it('should reset to default settings', () => {
      enableDataSaver({ imageQuality: 'low', disableAnimations: true });

      const result = disableDataSaver();

      expect(result.imageQuality).toBe('high');
      expect(result.disableAnimations).toBe(false);
    });

    it('should remove data saver styles', () => {
      enableDataSaver({ disableAnimations: true });
      const stylesBefore = document.getElementById('data-saver-styles');
      expect(stylesBefore).not.toBeNull();

      disableDataSaver();

      const stylesAfter = document.getElementById('data-saver-styles');
      expect(stylesAfter).toBeNull();
    });

    it('should disable data saver mode', () => {
      enableDataSaver();
      disableDataSaver();
      expect(isDataSaverEnabled()).toBe(false);
    });
  });

  describe('isDataSaverEnabled', () => {
    it('should return false by default', () => {
      expect(isDataSaverEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      enableDataSaver();

      expect(isDataSaverEnabled()).toBe(true);
    });

    it('should return false after disabling', () => {
      enableDataSaver();
      disableDataSaver();

      expect(isDataSaverEnabled()).toBe(false);
    });
  });

  describe('getDataSaverSettings', () => {
    it('should return default settings when not configured', () => {
      const settings = getDataSaverSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.imageQuality).toBe('high');
      expect(settings.lazyLoadImages).toBe(true);
    });

    it('should return current settings after enabling', () => {
      enableDataSaver({ imageQuality: 'low' });

      const settings = getDataSaverSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.imageQuality).toBe('low');
    });

    it('should persist settings across calls', () => {
      enableDataSaver();

      const settings1 = getDataSaverSettings();
      const settings2 = getDataSaverSettings();

      expect(settings1).toEqual(settings2);
    });
  });

  describe('updateDataSaverSettings', () => {
    it('should update specific settings', () => {
      enableDataSaver();

      const result = updateDataSaverSettings({ imageQuality: 'low' });

      expect(result.imageQuality).toBe('low');
      expect(result.enabled).toBe(true); // Other settings preserved
    });

    it('should handle enabled state change', () => {
      enableDataSaver();

      updateDataSaverSettings({ enabled: false });

      expect(isDataSaverEnabled()).toBe(false);
    });

    it('should persist updated settings', () => {
      enableDataSaver();
      updateDataSaverSettings({ disableAnimations: true });

      const settings = getDataSaverSettings();
      expect(settings.disableAnimations).toBe(true);
    });
  });

  describe('setImageQuality', () => {
    it('should set image quality to high', () => {
      const result = setImageQuality('high');

      expect(result.imageQuality).toBe('high');
      expect(result.disableHDImages).toBe(false);
    });

    it('should set image quality to medium', () => {
      const result = setImageQuality('medium');

      expect(result.imageQuality).toBe('medium');
      expect(result.disableHDImages).toBe(true);
    });

    it('should set image quality to low', () => {
      const result = setImageQuality('low');

      expect(result.imageQuality).toBe('low');
    });

    it('should set image quality to off', () => {
      const result = setImageQuality('off');

      expect(result.imageQuality).toBe('off');
    });

    it('should fallback to medium for invalid quality', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = setImageQuality('invalid');

      expect(result.imageQuality).toBe('medium');
      expect(warnSpy).toHaveBeenCalledWith(
        "[DataSaver] Invalid image quality: invalid. Using 'medium'."
      );

      warnSpy.mockRestore();
    });

    it('should accept valid quality setting', () => {
      setImageQuality('low');
      const config = getImageQualityConfig('low');
      expect(config).toBeDefined();
    });
  });

  describe('getImageQualityConfig', () => {
    it('should return high quality config', () => {
      const config = getImageQualityConfig('high');

      expect(config.maxWidth).toBe(1920);
      expect(config.maxHeight).toBe(1080);
      expect(config.quality).toBe(0.92);
    });

    it('should return medium quality config', () => {
      const config = getImageQualityConfig('medium');

      expect(config.maxWidth).toBe(1280);
      expect(config.maxHeight).toBe(720);
      expect(config.quality).toBe(0.75);
    });

    it('should return low quality config', () => {
      const config = getImageQualityConfig('low');

      expect(config.maxWidth).toBe(640);
      expect(config.maxHeight).toBe(480);
      expect(config.quality).toBe(0.5);
    });

    it('should return off config', () => {
      const config = getImageQualityConfig('off');

      expect(config.maxWidth).toBe(0);
      expect(config.format).toBeNull();
    });

    it('should fallback to medium for unknown quality', () => {
      const config = getImageQualityConfig('unknown');

      expect(config).toEqual(getImageQualityConfig('medium'));
    });
  });

  describe('getCurrentImageQuality', () => {
    it('should return default high quality', () => {
      expect(getCurrentImageQuality()).toBe('high');
    });

    it('should return current quality after change', () => {
      setImageQuality('low');

      expect(getCurrentImageQuality()).toBe('low');
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return original URL when data saver disabled', () => {
      const url = 'https://example.com/image.jpg';

      const result = getOptimizedImageUrl(url);

      expect(result).toBe(url);
    });

    it('should return empty string when quality is off', () => {
      enableDataSaver({ imageQuality: 'off' });

      const result = getOptimizedImageUrl('https://example.com/image.jpg');

      expect(result).toBe('');
    });

    it('should add params for Cloudinary URLs', () => {
      enableDataSaver({ imageQuality: 'medium' });

      const result = getOptimizedImageUrl('https://res.cloudinary.com/demo/image.jpg');

      expect(result).toContain('w=1280');
      expect(result).toContain('q=75');
    });

    it('should add params for imgix URLs', () => {
      enableDataSaver({ imageQuality: 'low' });

      const result = getOptimizedImageUrl('https://example.imgix.net/image.jpg');

      expect(result).toContain('w=640');
      expect(result).toContain('q=50');
    });

    it('should handle Firebase Storage URLs', () => {
      enableDataSaver({ imageQuality: 'medium' });
      const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/image.jpg';

      const result = getOptimizedImageUrl(url);

      expect(result).toBe(url); // Firebase doesn't support resizing
    });

    it('should handle null/undefined URL', () => {
      expect(getOptimizedImageUrl(null)).toBeNull();
      expect(getOptimizedImageUrl(undefined)).toBeUndefined();
    });

    it('should accept quality override option', () => {
      enableDataSaver({ imageQuality: 'medium' });

      const result = getOptimizedImageUrl('https://res.cloudinary.com/demo/image.jpg', { quality: 'low' });

      expect(result).toContain('w=640');
    });
  });

  describe('shouldPreload', () => {
    it('should return true when data saver disabled', () => {
      expect(shouldPreload()).toBe(true);
    });

    it('should return false when limitPreload enabled', () => {
      enableDataSaver({ limitPreload: true });

      expect(shouldPreload()).toBe(false);
    });

    it('should return true when limitPreload disabled', () => {
      enableDataSaver({ limitPreload: false });

      expect(shouldPreload()).toBe(true);
    });

    it('should track blocked preloads', () => {
      enableDataSaver({ limitPreload: true });

      shouldPreload();
      shouldPreload();

      const savings = getDataSavings();
      expect(savings.preloadsBlocked).toBe(2);
    });
  });

  describe('getPollingInterval', () => {
    it('should return default interval when data saver disabled', () => {
      expect(getPollingInterval(30000)).toBe(30000);
    });

    it('should triple interval when reducedPollingInterval enabled', () => {
      enableDataSaver({ reducedPollingInterval: true });

      expect(getPollingInterval(30000)).toBe(90000);
    });

    it('should use default 30000ms when not specified', () => {
      enableDataSaver({ reducedPollingInterval: true });

      expect(getPollingInterval()).toBe(90000);
    });
  });

  describe('recordCompressedRequest', () => {
    it('should record compression savings', () => {
      enableDataSaver({ compressRequests: true });

      recordCompressedRequest(10240, 5120); // 10KB -> 5KB

      const savings = getDataSavings();
      expect(savings.requestsCompressed).toBe(1);
      expect(savings.totalSavedKB).toBe(5);
    });

    it('should not record when data saver disabled', () => {
      recordCompressedRequest(10240, 5120);

      const savings = getDataSavings();
      expect(savings.requestsCompressed).toBe(0);
    });

    it('should accumulate multiple compressions', () => {
      enableDataSaver({ compressRequests: true });

      recordCompressedRequest(10240, 5120);
      recordCompressedRequest(20480, 10240);

      const savings = getDataSavings();
      expect(savings.requestsCompressed).toBe(2);
      expect(savings.totalSavedKB).toBe(15);
    });
  });

  describe('getDataSavings', () => {
    it('should return initial savings state', () => {
      const savings = getDataSavings();

      expect(savings.totalSavedKB).toBe(0);
      expect(savings.totalSavedMB).toBe(0);
      expect(savings.imagesOptimized).toBe(0);
      expect(savings.requestsCompressed).toBe(0);
      expect(savings.preloadsBlocked).toBe(0);
    });

    it('should calculate totalSavedMB correctly', () => {
      enableDataSaver({ compressRequests: true });

      // Save 2048KB = 2MB
      recordCompressedRequest(2048 * 1024, 0);

      const savings = getDataSavings();
      expect(savings.totalSavedMB).toBe(2);
    });

    it('should track session duration', () => {
      const savings = getDataSavings();

      expect(savings.sessionDurationMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetDataSavings', () => {
    it('should reset all savings counters', () => {
      enableDataSaver({ compressRequests: true, limitPreload: true });
      recordCompressedRequest(10240, 5120);
      shouldPreload();

      resetDataSavings();

      const savings = getDataSavings();
      expect(savings.totalSavedKB).toBe(0);
      expect(savings.requestsCompressed).toBe(0);
      expect(savings.preloadsBlocked).toBe(0);
    });

    it('should reset session start time', () => {
      const savingsBefore = getDataSavings();

      // Reset should create a new session start timestamp
      resetDataSavings();

      const savingsAfter = getDataSavings();
      // After reset, session duration should be close to 0
      expect(savingsAfter.sessionDurationMinutes).toBe(0);
    });
  });

  describe('renderDataSaverToggle', () => {
    it('should render toggle component', () => {
      const html = renderDataSaverToggle();

      expect(html).toContain('data-saver-toggle');
      expect(html).toContain('Mode economie de donnees');
      expect(html).toContain('toggleDataSaver');
    });

    it('should show checked state when enabled', () => {
      enableDataSaver();

      const html = renderDataSaverToggle();

      expect(html).toContain('checked');
    });

    it('should render compact version', () => {
      const html = renderDataSaverToggle({ compact: true });

      expect(html).toContain('data-saver-toggle-compact');
      expect(html).not.toContain('Reduisez votre consommation');
    });

    it('should show settings when enabled', () => {
      enableDataSaver();

      const html = renderDataSaverToggle();

      expect(html).toContain('Qualite des images');
      expect(html).toContain('Limiter le prechargement');
      expect(html).toContain('Compresser les requetes');
    });

    it('should show savings details when requested', () => {
      enableDataSaver();

      const html = renderDataSaverToggle({ showDetails: true });

      expect(html).toContain('Economies estimees');
      expect(html).toContain('Cette session');
      expect(html).toContain('Par mois');
    });

    it('should include aria labels for accessibility', () => {
      const html = renderDataSaverToggle();

      expect(html).toContain('aria-label');
      expect(html).toContain('role="region"');
    });
  });

  describe('renderSavingsIndicator', () => {
    it('should return empty string when disabled', () => {
      const html = renderSavingsIndicator();

      expect(html).toBe('');
    });

    it('should show indicator when enabled', () => {
      enableDataSaver();

      const html = renderSavingsIndicator();

      expect(html).toContain('data-saver-indicator');
      expect(html).toContain('Mo economises');
    });

    it('should include leaf icon', () => {
      enableDataSaver();

      const html = renderSavingsIndicator();

      expect(html).toContain('fa-leaf');
    });

    it('should have live region for accessibility', () => {
      enableDataSaver();

      const html = renderSavingsIndicator();

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });
  });

  describe('checkDataSaverSupport', () => {
    it('should return feature support object', () => {
      const support = checkDataSaverSupport();

      expect(support).toHaveProperty('intersectionObserver');
      expect(support).toHaveProperty('webp');
      expect(support).toHaveProperty('compressionStream');
      expect(support).toHaveProperty('saveData');
      expect(support).toHaveProperty('effectiveType');
    });

    it('should detect IntersectionObserver support', () => {
      const support = checkDataSaverSupport();

      expect(typeof support.intersectionObserver).toBe('boolean');
    });
  });

  describe('detectSaveDataPreference', () => {
    it('should return false when connection API not available', () => {
      expect(detectSaveDataPreference()).toBe(false);
    });

    it('should detect saveData preference when available', () => {
      // Mock navigator.connection
      const originalConnection = navigator.connection;
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true },
        configurable: true,
      });

      expect(detectSaveDataPreference()).toBe(true);

      // Restore
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        configurable: true,
      });
    });
  });

  describe('getNetworkInfo', () => {
    it('should return null when connection API not available', () => {
      const originalConnection = navigator.connection;
      delete navigator.connection;

      const info = getNetworkInfo();

      expect(info).toBeNull();

      // Restore (if it existed)
      if (originalConnection) {
        Object.defineProperty(navigator, 'connection', {
          value: originalConnection,
          configurable: true,
        });
      }
    });

    it('should return network info when available', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false,
        },
        configurable: true,
      });

      const info = getNetworkInfo();

      expect(info.effectiveType).toBe('4g');
      expect(info.downlink).toBe(10);
      expect(info.rtt).toBe(50);
      expect(info.saveData).toBe(false);
    });
  });

  describe('autoEnableBasedOnNetwork', () => {
    afterEach(() => {
      // Clean up navigator.connection mock
      delete navigator.connection;
    });

    it('should return false when connection API not available', () => {
      delete navigator.connection;

      const result = autoEnableBasedOnNetwork();

      expect(result).toBe(false);
    });

    it('should auto-enable on saveData preference', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true, effectiveType: '4g' },
        configurable: true,
      });

      const result = autoEnableBasedOnNetwork();

      expect(result).toBe(true);
      expect(isDataSaverEnabled()).toBe(true);
      expect(getCurrentImageQuality()).toBe('low');
    });

    it('should auto-enable on 2g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: false, effectiveType: '2g' },
        configurable: true,
      });

      const result = autoEnableBasedOnNetwork();

      expect(result).toBe(true);
      const settings = getDataSaverSettings();
      expect(settings.disableAnimations).toBe(true);
    });

    it('should auto-enable with medium quality on 3g', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: false, effectiveType: '3g' },
        configurable: true,
      });

      const result = autoEnableBasedOnNetwork();

      expect(result).toBe(true);
      expect(getCurrentImageQuality()).toBe('medium');
    });

    it('should not auto-enable on 4g', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: false, effectiveType: '4g' },
        configurable: true,
      });

      const result = autoEnableBasedOnNetwork();

      expect(result).toBe(false);
      expect(isDataSaverEnabled()).toBe(false);
    });
  });

  describe('getImageQualityLevels', () => {
    it('should return all quality levels', () => {
      const levels = getImageQualityLevels();

      expect(levels).toHaveLength(4);
      expect(levels.map(l => l.id)).toEqual(['high', 'medium', 'low', 'off']);
    });

    it('should include labels and descriptions', () => {
      const levels = getImageQualityLevels();

      levels.forEach(level => {
        expect(level).toHaveProperty('label');
        expect(level).toHaveProperty('description');
        expect(level).toHaveProperty('icon');
      });
    });

    it('should have French labels', () => {
      const levels = getImageQualityLevels();
      const high = levels.find(l => l.id === 'high');

      expect(high.label).toBe('Haute qualite');
    });
  });

  describe('CSS Styles Application', () => {
    it('should add style element when enabling with animations disabled', () => {
      enableDataSaver({ disableAnimations: true });

      const styleEl = document.getElementById('data-saver-styles');
      expect(styleEl).not.toBeNull();
      expect(styleEl.textContent).toContain('animation-duration');
    });

    it('should add image hiding styles when quality is off', () => {
      enableDataSaver({ imageQuality: 'off' });

      const styleEl = document.getElementById('data-saver-styles');
      expect(styleEl.textContent).toContain('display: none');
    });

    it('should remove style element when disabling', () => {
      enableDataSaver({ disableAnimations: true });
      expect(document.getElementById('data-saver-styles')).not.toBeNull();

      disableDataSaver();
      expect(document.getElementById('data-saver-styles')).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete data saver workflow', () => {
      // Enable
      enableDataSaver({ imageQuality: 'medium', compressRequests: true });
      expect(isDataSaverEnabled()).toBe(true);

      // Track savings
      recordCompressedRequest(10240, 5120);
      shouldPreload(); // Blocked

      // Check savings
      const savings = getDataSavings();
      expect(savings.requestsCompressed).toBe(1);

      // Render UI
      const toggle = renderDataSaverToggle({ showDetails: true });
      expect(toggle).toContain('Economies estimees');

      // Disable
      disableDataSaver();
      expect(isDataSaverEnabled()).toBe(false);
    });

    it('should maintain settings across enable/disable cycles', () => {
      enableDataSaver({ imageQuality: 'low' });
      expect(getCurrentImageQuality()).toBe('low');

      disableDataSaver();
      expect(getCurrentImageQuality()).toBe('high');

      enableDataSaver(); // Re-enable with defaults
      expect(getCurrentImageQuality()).toBe('medium');
    });

    it('should handle rapid setting changes', () => {
      enableDataSaver();
      setImageQuality('low');
      setImageQuality('medium');
      setImageQuality('high');
      updateDataSaverSettings({ limitPreload: false });
      updateDataSaverSettings({ compressRequests: false });

      const settings = getDataSaverSettings();
      expect(settings.imageQuality).toBe('high');
      expect(settings.limitPreload).toBe(false);
      expect(settings.compressRequests).toBe(false);
    });
  });
});
