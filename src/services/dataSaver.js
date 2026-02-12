/**
 * Data Saver Service
 * Reduces data consumption for users with limited connectivity or data plans
 */

import { Storage } from '../utils/storage.js';

// Storage key for data saver settings
const DATA_SAVER_KEY = 'dataSaver';

// Default settings
const defaultSettings = {
  enabled: false,
  imageQuality: 'high', // 'high' | 'medium' | 'low' | 'off'
  disableHDImages: false,
  limitPreload: false,
  compressRequests: false,
  lazyLoadImages: true,
  disableAnimations: false,
  cacheAggressively: false,
  reducedPollingInterval: false,
};

// Image quality configurations
const imageQualityConfig = {
  high: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.92,
    format: 'webp',
    sizeMultiplier: 1.0,
  },
  medium: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.75,
    format: 'webp',
    sizeMultiplier: 0.5,
  },
  low: {
    maxWidth: 640,
    maxHeight: 480,
    quality: 0.5,
    format: 'webp',
    sizeMultiplier: 0.25,
  },
  off: {
    maxWidth: 0,
    maxHeight: 0,
    quality: 0,
    format: null,
    sizeMultiplier: 0,
  },
};

// Estimated data usage per feature (in KB)
const dataUsageEstimates = {
  hdImage: 500, // Average HD image size in KB
  mediumImage: 150,
  lowImage: 50,
  mapTile: 25,
  apiRequest: 5,
  chatMessage: 2,
  spotData: 10,
  preloadedContent: 200,
};

// Track data savings
let dataSavingsLog = {
  totalSavedKB: 0,
  imagesOptimized: 0,
  requestsCompressed: 0,
  preloadsBlocked: 0,
  sessionStart: Date.now(),
};

/**
 * Initialize data saver settings from storage
 * @returns {Object} Current settings
 */
function loadSettings() {
  const stored = Storage.get(DATA_SAVER_KEY);
  return stored ? { ...defaultSettings, ...stored } : { ...defaultSettings };
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings to save
 */
function saveSettings(settings) {
  Storage.set(DATA_SAVER_KEY, settings);
}

/**
 * Enable data saver mode
 * @param {Object} options - Optional specific settings to enable
 * @returns {Object} Updated settings
 */
export function enableDataSaver(options = {}) {
  const settings = loadSettings();

  const enabledSettings = {
    ...settings,
    enabled: true,
    imageQuality: options.imageQuality || 'medium',
    disableHDImages: options.disableHDImages !== undefined ? options.disableHDImages : true,
    limitPreload: options.limitPreload !== undefined ? options.limitPreload : true,
    compressRequests: options.compressRequests !== undefined ? options.compressRequests : true,
    lazyLoadImages: options.lazyLoadImages !== undefined ? options.lazyLoadImages : true,
    disableAnimations: options.disableAnimations !== undefined ? options.disableAnimations : false,
    cacheAggressively: options.cacheAggressively !== undefined ? options.cacheAggressively : true,
    reducedPollingInterval: options.reducedPollingInterval !== undefined ? options.reducedPollingInterval : true,
  };

  saveSettings(enabledSettings);
  applyDataSaverStyles(true);

  return enabledSettings;
}

/**
 * Disable data saver mode
 * @returns {Object} Updated settings (reset to defaults)
 */
export function disableDataSaver() {
  const settings = { ...defaultSettings, enabled: false };
  saveSettings(settings);
  applyDataSaverStyles(false);

  return settings;
}

/**
 * Check if data saver is enabled
 * @returns {boolean}
 */
export function isDataSaverEnabled() {
  const settings = loadSettings();
  return settings.enabled === true;
}

/**
 * Get current data saver settings
 * @returns {Object} Current settings
 */
export function getDataSaverSettings() {
  return loadSettings();
}

/**
 * Update specific data saver settings
 * @param {Object} updates - Settings to update
 * @returns {Object} Updated settings
 */
export function updateDataSaverSettings(updates) {
  const settings = loadSettings();
  const updated = { ...settings, ...updates };
  saveSettings(updated);

  // Re-apply styles if enabled state changed
  if (updates.enabled !== undefined) {
    applyDataSaverStyles(updates.enabled);
  }

  return updated;
}

/**
 * Set image quality level
 * @param {string} quality - 'high' | 'medium' | 'low' | 'off'
 * @returns {Object} Updated settings
 */
export function setImageQuality(quality) {
  const validQualities = ['high', 'medium', 'low', 'off'];

  if (!validQualities.includes(quality)) {
    console.warn(`[DataSaver] Invalid image quality: ${quality}. Using 'medium'.`);
    quality = 'medium';
  }

  const settings = loadSettings();
  settings.imageQuality = quality;
  settings.disableHDImages = quality !== 'high';

  saveSettings(settings);

  return settings;
}

/**
 * Get image quality configuration
 * @param {string} quality - Quality level
 * @returns {Object} Quality configuration
 */
export function getImageQualityConfig(quality) {
  return imageQualityConfig[quality] || imageQualityConfig.medium;
}

/**
 * Get current image quality level
 * @returns {string} Current quality level
 */
export function getCurrentImageQuality() {
  const settings = loadSettings();
  return settings.imageQuality || 'high';
}

/**
 * Calculate optimized image URL based on quality settings
 * @param {string} originalUrl - Original image URL
 * @param {Object} options - Optional overrides
 * @returns {string} Optimized URL or original if not applicable
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  if (!originalUrl) return originalUrl;

  const settings = loadSettings();

  if (!settings.enabled) {
    return originalUrl;
  }

  const quality = options.quality || settings.imageQuality;

  if (quality === 'off') {
    return ''; // Return empty to prevent loading
  }

  const config = imageQualityConfig[quality];

  // If URL supports query params for resizing (e.g., Cloudinary, imgix)
  if (originalUrl.includes('cloudinary.com') || originalUrl.includes('imgix.net')) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}w=${config.maxWidth}&q=${Math.round(config.quality * 100)}`;
  }

  // For Firebase Storage or other URLs, add width param if supported
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    // Firebase doesn't support on-the-fly resizing, return original
    return originalUrl;
  }

  // Track the optimization
  if (quality !== 'high') {
    dataSavingsLog.imagesOptimized++;
    const savedKB = dataUsageEstimates.hdImage * (1 - config.sizeMultiplier);
    dataSavingsLog.totalSavedKB += savedKB;
  }

  return originalUrl;
}

/**
 * Check if preloading should be allowed
 * @param {string} resourceType - Type of resource
 * @returns {boolean}
 */
export function shouldPreload(resourceType = 'default') {
  const settings = loadSettings();

  if (!settings.enabled) {
    return true;
  }

  if (settings.limitPreload) {
    dataSavingsLog.preloadsBlocked++;
    dataSavingsLog.totalSavedKB += dataUsageEstimates.preloadedContent;
    return false;
  }

  return true;
}

/**
 * Get recommended polling interval based on data saver settings
 * @param {number} defaultInterval - Default interval in ms
 * @returns {number} Adjusted interval
 */
export function getPollingInterval(defaultInterval = 30000) {
  const settings = loadSettings();

  if (settings.enabled && settings.reducedPollingInterval) {
    // Triple the polling interval to reduce data usage
    return defaultInterval * 3;
  }

  return defaultInterval;
}

/**
 * Record a compressed request
 * @param {number} originalSize - Original size in bytes
 * @param {number} compressedSize - Compressed size in bytes
 */
export function recordCompressedRequest(originalSize, compressedSize) {
  const settings = loadSettings();

  if (settings.enabled && settings.compressRequests) {
    dataSavingsLog.requestsCompressed++;
    const savedKB = (originalSize - compressedSize) / 1024;
    dataSavingsLog.totalSavedKB += savedKB;
  }
}

/**
 * Get estimated data savings
 * @returns {Object} Savings statistics
 */
export function getDataSavings() {
  const sessionDuration = (Date.now() - dataSavingsLog.sessionStart) / 1000 / 60; // minutes

  return {
    totalSavedKB: Math.round(dataSavingsLog.totalSavedKB),
    totalSavedMB: Math.round(dataSavingsLog.totalSavedKB / 1024 * 100) / 100,
    imagesOptimized: dataSavingsLog.imagesOptimized,
    requestsCompressed: dataSavingsLog.requestsCompressed,
    preloadsBlocked: dataSavingsLog.preloadsBlocked,
    sessionDurationMinutes: Math.round(sessionDuration),
    estimatedMonthlySavingsMB: Math.round((dataSavingsLog.totalSavedKB / sessionDuration) * 30 * 24 * 60 / 1024) || 0,
  };
}

/**
 * Reset data savings log
 */
export function resetDataSavings() {
  dataSavingsLog = {
    totalSavedKB: 0,
    imagesOptimized: 0,
    requestsCompressed: 0,
    preloadsBlocked: 0,
    sessionStart: Date.now(),
  };
}

/**
 * Apply or remove data saver CSS styles
 * @param {boolean} enabled - Whether to apply or remove
 */
function applyDataSaverStyles(enabled) {
  const styleId = 'data-saver-styles';
  let styleElement = document.getElementById(styleId);

  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const settings = loadSettings();
    let css = '';

    if (settings.disableAnimations) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
    }

    if (settings.imageQuality === 'off') {
      css += `
        img:not([data-essential="true"]) {
          display: none !important;
        }
        .bg-image:not([data-essential="true"]) {
          background-image: none !important;
        }
      `;
    }

    styleElement.textContent = css;
  } else {
    if (styleElement) {
      styleElement.remove();
    }
  }
}

/**
 * Render data saver toggle UI component
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderDataSaverToggle(options = {}) {
  const settings = loadSettings();
  const savings = getDataSavings();
  const { showDetails = false, compact = false } = options;

  if (compact) {
    return `
      <div class="data-saver-toggle-compact flex items-center gap-2">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            class="sr-only peer"
            ${settings.enabled ? 'checked' : ''}
            onchange="window.toggleDataSaver()"
            aria-label="Mode economie de donnees"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
        </label>
        <span class="text-sm ${settings.enabled ? 'text-primary-500' : 'text-slate-500'}">
          <i class="fas fa-leaf mr-1"></i>
          ${settings.enabled ? 'Actif' : 'Inactif'}
        </span>
      </div>
    `;
  }

  return `
    <div class="data-saver-toggle bg-white dark:bg-dark-secondary rounded-lg p-4 shadow-md" role="region" aria-label="Parametres economie de donnees">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <i class="fas fa-leaf text-green-600 dark:text-green-400"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Mode economie de donnees</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">Reduisez votre consommation</p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            class="sr-only peer"
            ${settings.enabled ? 'checked' : ''}
            onchange="window.toggleDataSaver()"
            aria-label="Activer le mode economie de donnees"
          />
          <div class="w-14 h-7 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
        </label>
      </div>

      ${settings.enabled ? `
        <div class="space-y-3 border-t border-gray-200 dark:border-white/10 pt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">Qualite des images</span>
            <select
              class="bg-gray-100 dark:bg-dark-primary rounded px-2 py-1 text-sm"
              onchange="window.setDataSaverImageQuality(this.value)"
              aria-label="Qualite des images"
            >
              <option value="high" ${settings.imageQuality === 'high' ? 'selected' : ''}>Haute</option>
              <option value="medium" ${settings.imageQuality === 'medium' ? 'selected' : ''}>Moyenne</option>
              <option value="low" ${settings.imageQuality === 'low' ? 'selected' : ''}>Basse</option>
              <option value="off" ${settings.imageQuality === 'off' ? 'selected' : ''}>Desactivees</option>
            </select>
          </div>

          <label class="flex items-center justify-between text-sm cursor-pointer">
            <span class="text-gray-600 dark:text-slate-400">Limiter le prechargement</span>
            <input
              type="checkbox"
              class="rounded text-primary-500 focus:ring-primary-500"
              ${settings.limitPreload ? 'checked' : ''}
              onchange="window.updateDataSaverOption('limitPreload', this.checked)"
            />
          </label>

          <label class="flex items-center justify-between text-sm cursor-pointer">
            <span class="text-gray-600 dark:text-slate-400">Compresser les requetes</span>
            <input
              type="checkbox"
              class="rounded text-primary-500 focus:ring-primary-500"
              ${settings.compressRequests ? 'checked' : ''}
              onchange="window.updateDataSaverOption('compressRequests', this.checked)"
            />
          </label>

          <label class="flex items-center justify-between text-sm cursor-pointer">
            <span class="text-gray-600 dark:text-slate-400">Desactiver les animations</span>
            <input
              type="checkbox"
              class="rounded text-primary-500 focus:ring-primary-500"
              ${settings.disableAnimations ? 'checked' : ''}
              onchange="window.updateDataSaverOption('disableAnimations', this.checked)"
            />
          </label>

          <label class="flex items-center justify-between text-sm cursor-pointer">
            <span class="text-gray-600 dark:text-slate-400">Reduire la frequence de rafraichissement</span>
            <input
              type="checkbox"
              class="rounded text-primary-500 focus:ring-primary-500"
              ${settings.reducedPollingInterval ? 'checked' : ''}
              onchange="window.updateDataSaverOption('reducedPollingInterval', this.checked)"
            />
          </label>
        </div>
      ` : ''}

      ${showDetails && settings.enabled ? `
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <div class="flex items-center gap-2 mb-3">
            <i class="fas fa-chart-line text-primary-500"></i>
            <span class="font-medium text-gray-900 dark:text-white">Economies estimees</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                ${savings.totalSavedMB} Mo
              </div>
              <div class="text-xs text-green-700 dark:text-green-300">Cette session</div>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ~${savings.estimatedMonthlySavingsMB} Mo
              </div>
              <div class="text-xs text-blue-700 dark:text-blue-300">Par mois (estime)</div>
            </div>
          </div>
          <div class="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
            ${savings.imagesOptimized} images optimisees - ${savings.preloadsBlocked} prechargements bloques
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render compact savings indicator
 * @returns {string} HTML string
 */
export function renderSavingsIndicator() {
  const settings = loadSettings();
  const savings = getDataSavings();

  if (!settings.enabled) {
    return '';
  }

  return `
    <div class="data-saver-indicator fixed bottom-20 right-4 bg-green-500 text-white rounded-full px-3 py-1 text-sm shadow-lg flex items-center gap-2 z-50" role="status" aria-live="polite">
      <i class="fas fa-leaf"></i>
      <span>${savings.totalSavedMB} Mo economises</span>
    </div>
  `;
}

/**
 * Check if browser supports data saver features
 * @returns {Object} Feature support
 */
export function checkDataSaverSupport() {
  return {
    intersectionObserver: 'IntersectionObserver' in window,
    webp: supportsWebP(),
    compressionStream: 'CompressionStream' in window,
    saveData: 'connection' in navigator && 'saveData' in navigator.connection,
    effectiveType: 'connection' in navigator && 'effectiveType' in navigator.connection,
  };
}

/**
 * Check WebP support
 * @returns {boolean}
 */
function supportsWebP() {
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Detect if user has requested reduced data mode via browser
 * @returns {boolean}
 */
export function detectSaveDataPreference() {
  if ('connection' in navigator && 'saveData' in navigator.connection) {
    return navigator.connection.saveData === true;
  }
  return false;
}

/**
 * Get network information if available
 * @returns {Object|null}
 */
export function getNetworkInfo() {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return {
      effectiveType: conn.effectiveType || 'unknown',
      downlink: conn.downlink || null,
      rtt: conn.rtt || null,
      saveData: conn.saveData || false,
    };
  }
  return null;
}

/**
 * Auto-enable data saver based on network conditions
 * @returns {boolean} Whether data saver was auto-enabled
 */
export function autoEnableBasedOnNetwork() {
  const networkInfo = getNetworkInfo();

  if (!networkInfo) {
    return false;
  }

  // Auto-enable if user has save-data preference
  if (networkInfo.saveData) {
    enableDataSaver({ imageQuality: 'low' });
    return true;
  }

  // Auto-enable on slow connections (2g, slow-2g)
  if (['slow-2g', '2g'].includes(networkInfo.effectiveType)) {
    enableDataSaver({ imageQuality: 'low', disableAnimations: true });
    return true;
  }

  // Enable with medium settings on 3g
  if (networkInfo.effectiveType === '3g') {
    enableDataSaver({ imageQuality: 'medium' });
    return true;
  }

  return false;
}

/**
 * Get all available quality levels
 * @returns {Array} Quality levels with descriptions
 */
export function getImageQualityLevels() {
  return [
    { id: 'high', label: 'Haute qualite', description: 'Images en pleine resolution', icon: 'fa-image' },
    { id: 'medium', label: 'Qualite moyenne', description: 'Images optimisees (~50% donnees)', icon: 'fa-compress' },
    { id: 'low', label: 'Basse qualite', description: 'Images tres compressees (~25% donnees)', icon: 'fa-compress-alt' },
    { id: 'off', label: 'Images desactivees', description: 'Aucune image chargee', icon: 'fa-ban' },
  ];
}

// Export default object for backward compatibility
export default {
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
};
