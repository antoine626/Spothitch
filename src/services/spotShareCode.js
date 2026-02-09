/**
 * Spot Share Code Service
 * Generate and resolve short human-readable codes for sharing spots
 * Format: COUNTRY-CITY-NUMBER (e.g., FR-PARIS-42, DE-BERLIN-07)
 */

import { getState } from '../stores/state.js';
import { sampleSpots } from '../data/spots.js';
import { t } from '../i18n/index.js';

// Storage key for share codes
const SHARE_CODES_KEY = 'spothitch_share_codes';

// Code generation constants
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0, O, 1, I)
const RANDOM_CODE_LENGTH = 4;

/**
 * Normalize city name for code generation
 * @param {string} city - City name
 * @returns {string} Normalized city name (uppercase, no accents, max 6 chars)
 */
function normalizeCityName(city) {
  if (!city || typeof city !== 'string') {
    return 'SPOT';
  }

  // Remove accents and special characters
  const normalized = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);

  return normalized || 'SPOT';
}

/**
 * Generate a random alphanumeric code
 * @param {number} length - Length of the code
 * @returns {string} Random code
 */
function generateRandomCode(length = RANDOM_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Get stored share codes from localStorage
 * @returns {Object} Map of spotId -> code and code -> spotId
 */
function getStoredCodes() {
  try {
    const stored = localStorage.getItem(SHARE_CODES_KEY);
    return stored ? JSON.parse(stored) : { spotToCode: {}, codeToSpot: {} };
  } catch {
    return { spotToCode: {}, codeToSpot: {} };
  }
}

/**
 * Save share codes to localStorage
 * @param {Object} codes - Codes object to save
 */
function saveStoredCodes(codes) {
  try {
    localStorage.setItem(SHARE_CODES_KEY, JSON.stringify(codes));
  } catch (error) {
    console.warn('[SpotShareCode] Failed to save codes:', error);
  }
}

/**
 * Get spot by ID from state or sample data
 * @param {string|number} spotId - Spot ID
 * @returns {Object|null} Spot object or null
 */
function findSpotById(spotId) {
  const state = getState();
  const spots = state.spots && state.spots.length > 0 ? state.spots : sampleSpots;

  // Convert to string for comparison
  const id = String(spotId);
  return spots.find(s => String(s.id) === id) || null;
}

/**
 * Generate a share code for a spot
 * Format: COUNTRY-CITY-XXXX (e.g., FR-PARIS-A7K2)
 * @param {string|number} spotId - Spot ID
 * @returns {{ success: boolean, code?: string, error?: string }} Result
 */
export function generateShareCode(spotId) {
  if (spotId === undefined || spotId === null) {
    return { success: false, error: 'invalid_spot_id' };
  }

  const spot = findSpotById(spotId);
  if (!spot) {
    return { success: false, error: 'spot_not_found' };
  }

  // Check if code already exists for this spot
  const storedCodes = getStoredCodes();
  const existingCode = storedCodes.spotToCode[String(spotId)];
  if (existingCode) {
    return { success: true, code: existingCode };
  }

  // Generate new code
  const country = (spot.country || 'XX').toUpperCase().substring(0, 2);
  const city = normalizeCityName(spot.from);

  // Generate unique random suffix
  let attempts = 0;
  let code;
  do {
    const randomPart = generateRandomCode();
    code = `${country}-${city}-${randomPart}`;
    attempts++;
  } while (storedCodes.codeToSpot[code] && attempts < 100);

  if (attempts >= 100) {
    return { success: false, error: 'code_generation_failed' };
  }

  // Store the code mapping
  storedCodes.spotToCode[String(spotId)] = code;
  storedCodes.codeToSpot[code] = String(spotId);
  saveStoredCodes(storedCodes);

  return { success: true, code };
}

/**
 * Resolve a share code to a spot ID
 * @param {string} code - Share code
 * @returns {{ success: boolean, spotId?: string, error?: string }} Result
 */
export function resolveShareCode(code) {
  if (!code || typeof code !== 'string') {
    return { success: false, error: 'invalid_code' };
  }

  const normalizedCode = code.trim().toUpperCase();

  // Validate code format (XX-XXXXXX-XXXX)
  const codePattern = /^[A-Z]{2}-[A-Z0-9]{1,6}-[A-Z0-9]{2,6}$/;
  if (!codePattern.test(normalizedCode)) {
    return { success: false, error: 'invalid_code_format' };
  }

  const storedCodes = getStoredCodes();
  const spotId = storedCodes.codeToSpot[normalizedCode];

  if (!spotId) {
    return { success: false, error: 'code_not_found' };
  }

  return { success: true, spotId };
}

/**
 * Get a spot by its share code
 * @param {string} code - Share code
 * @returns {{ success: boolean, spot?: Object, error?: string }} Result
 */
export function getSpotByCode(code) {
  const resolveResult = resolveShareCode(code);

  if (!resolveResult.success) {
    return { success: false, error: resolveResult.error };
  }

  const spot = findSpotById(resolveResult.spotId);

  if (!spot) {
    return { success: false, error: 'spot_not_found' };
  }

  return { success: true, spot };
}

/**
 * Get the share code for a spot (if it exists)
 * @param {string|number} spotId - Spot ID
 * @returns {string|null} Share code or null
 */
export function getCodeForSpot(spotId) {
  if (spotId === undefined || spotId === null) {
    return null;
  }

  const storedCodes = getStoredCodes();
  return storedCodes.spotToCode[String(spotId)] || null;
}

/**
 * Check if a share code is valid
 * @param {string} code - Share code
 * @returns {boolean} True if code is valid and resolves to a spot
 */
export function isValidShareCode(code) {
  const result = resolveShareCode(code);
  return result.success;
}

/**
 * Parse a share code into its components
 * @param {string} code - Share code
 * @returns {{ country: string, city: string, suffix: string }|null} Components or null
 */
export function parseShareCode(code) {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const normalizedCode = code.trim().toUpperCase();
  const parts = normalizedCode.split('-');

  if (parts.length !== 3) {
    return null;
  }

  const [country, city, suffix] = parts;

  if (!country || !city || !suffix) {
    return null;
  }

  if (country.length !== 2 || !/^[A-Z]{2}$/.test(country)) {
    return null;
  }

  if (city.length < 1 || city.length > 6 || !/^[A-Z0-9]+$/.test(city)) {
    return null;
  }

  if (suffix.length < 2 || suffix.length > 6 || !/^[A-Z0-9]+$/.test(suffix)) {
    return null;
  }

  return { country, city, suffix };
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type
 */
function showToast(message, type = 'success') {
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand
    }
  }

  // Legacy fallback
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Copy a share code to clipboard
 * @param {string} code - Share code to copy
 * @returns {Promise<{ success: boolean, error?: string }>} Result
 */
export async function copyCodeToClipboard(code) {
  if (!code || typeof code !== 'string') {
    return { success: false, error: 'invalid_code' };
  }

  const copied = await copyToClipboard(code);

  if (copied) {
    showToast(t('codeCopied') || 'Code copie !');
    return { success: true };
  }

  return { success: false, error: 'copy_failed' };
}

/**
 * Escape HTML for safe rendering
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render a share code display/card for a spot
 * @param {Object} spot - Spot object
 * @returns {string} HTML string
 */
export function renderShareCode(spot) {
  if (!spot || !spot.id) {
    return '';
  }

  // Generate code if not exists
  const result = generateShareCode(spot.id);

  if (!result.success) {
    return `
      <div class="share-code-error p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
        <p class="text-red-600 dark:text-red-400">${escapeHTML(t('shareCodeError') || 'Erreur de generation du code')}</p>
      </div>
    `;
  }

  const code = result.code;
  const parsed = parseShareCode(code);
  const spotFrom = escapeHTML(spot.from || '');
  const spotTo = escapeHTML(spot.to || '');

  return `
    <div class="share-code-card p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-500/20 dark:to-primary-600/20 border border-primary-500/30 rounded-xl">
      <div class="text-center mb-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">${escapeHTML(t('shareCodeLabel') || 'Code de partage')}</p>
        <div class="share-code-value font-mono text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-wider" data-code="${escapeHTML(code)}">
          ${parsed ? `<span class="share-code-country">${escapeHTML(parsed.country)}</span><span class="text-gray-400">-</span><span class="share-code-city">${escapeHTML(parsed.city)}</span><span class="text-gray-400">-</span><span class="share-code-suffix">${escapeHTML(parsed.suffix)}</span>` : escapeHTML(code)}
        </div>
      </div>

      <div class="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span class="inline-flex items-center gap-1">
          <i class="fas fa-map-marker-alt text-primary-500" aria-hidden="true"></i>
          ${spotFrom}${spotTo ? ` → ${spotTo}` : ''}
        </span>
      </div>

      <div class="flex justify-center gap-2">
        <button
          type="button"
          class="share-code-copy-btn flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onclick="window.copySpotShareCode('${escapeHTML(code)}')"
          aria-label="${escapeHTML(t('copyCode') || 'Copier le code')}"
        >
          <i class="fas fa-copy" aria-hidden="true"></i>
          <span>${escapeHTML(t('copyCode') || 'Copier')}</span>
        </button>
      </div>

      <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
        ${escapeHTML(t('shareCodeHint') || 'Partagez ce code pour que vos amis trouvent ce spot facilement !')}
      </p>
    </div>
  `;
}

/**
 * Render a compact share code badge
 * @param {Object} spot - Spot object
 * @returns {string} HTML string
 */
export function renderShareCodeBadge(spot) {
  if (!spot || !spot.id) {
    return '';
  }

  const existingCode = getCodeForSpot(spot.id);

  if (!existingCode) {
    // Return a "generate code" button
    return `
      <button
        type="button"
        class="share-code-generate-btn inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
        onclick="window.generateAndShowSpotCode(${spot.id})"
        aria-label="${escapeHTML(t('generateCode') || 'Generer un code')}"
      >
        <i class="fas fa-qrcode" aria-hidden="true"></i>
        <span>${escapeHTML(t('getCode') || 'Code')}</span>
      </button>
    `;
  }

  return `
    <button
      type="button"
      class="share-code-badge inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
      onclick="window.copySpotShareCode('${escapeHTML(existingCode)}')"
      aria-label="${escapeHTML(t('copyCode') || 'Copier le code')} ${escapeHTML(existingCode)}"
      title="${escapeHTML(existingCode)}"
    >
      <i class="fas fa-share-alt" aria-hidden="true"></i>
      <span class="share-code-text">${escapeHTML(existingCode)}</span>
    </button>
  `;
}

/**
 * Render the share code input/lookup form
 * @returns {string} HTML string
 */
export function renderShareCodeLookup() {
  return `
    <div class="share-code-lookup p-4 bg-white dark:bg-dark-secondary rounded-xl shadow-lg">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        <i class="fas fa-search text-primary-500 mr-2" aria-hidden="true"></i>
        ${escapeHTML(t('findSpotByCode') || 'Trouver un spot par code')}
      </h3>

      <div class="flex gap-2">
        <input
          type="text"
          id="share-code-input"
          class="share-code-input flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-primary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono uppercase"
          placeholder="${escapeHTML(t('enterCode') || 'Ex: FR-PARIS-A7K2')}"
          maxlength="15"
          aria-label="${escapeHTML(t('shareCodeInputLabel') || 'Entrez un code de partage')}"
          onkeyup="if(event.key === 'Enter') window.lookupShareCode()"
        />
        <button
          type="button"
          class="share-code-lookup-btn px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onclick="window.lookupShareCode()"
          aria-label="${escapeHTML(t('searchSpot') || 'Rechercher le spot')}"
        >
          <i class="fas fa-search" aria-hidden="true"></i>
        </button>
      </div>

      <div id="share-code-result" class="share-code-result mt-3 hidden"></div>
    </div>
  `;
}

/**
 * Lookup a share code and show the result
 * Called from the lookup form
 */
export function lookupShareCode() {
  const input = document.getElementById('share-code-input');
  const resultDiv = document.getElementById('share-code-result');

  if (!input || !resultDiv) {
    return;
  }

  const code = input.value.trim();

  if (!code) {
    resultDiv.innerHTML = `<p class="text-yellow-600 dark:text-yellow-400">${escapeHTML(t('enterCodeFirst') || 'Entrez un code')}</p>`;
    resultDiv.classList.remove('hidden');
    return;
  }

  const result = getSpotByCode(code);

  if (!result.success) {
    let errorMessage;
    switch (result.error) {
      case 'invalid_code':
      case 'invalid_code_format':
        errorMessage = t('invalidCodeFormat') || 'Format de code invalide';
        break;
      case 'code_not_found':
        errorMessage = t('codeNotFound') || 'Code non trouve';
        break;
      case 'spot_not_found':
        errorMessage = t('spotNotFound') || 'Spot introuvable';
        break;
      default:
        errorMessage = t('lookupError') || 'Erreur de recherche';
    }

    resultDiv.innerHTML = `
      <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
        <p class="text-red-600 dark:text-red-400">
          <i class="fas fa-exclamation-circle mr-1" aria-hidden="true"></i>
          ${escapeHTML(errorMessage)}
        </p>
      </div>
    `;
    resultDiv.classList.remove('hidden');
    return;
  }

  const spot = result.spot;

  resultDiv.innerHTML = `
    <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-gray-900 dark:text-white">
            ${escapeHTML(spot.from || '')}${spot.to ? ` → ${escapeHTML(spot.to)}` : ''}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            ${spot.country ? `<span class="inline-flex items-center"><i class="fas fa-flag mr-1" aria-hidden="true"></i>${escapeHTML(spot.country)}</span>` : ''}
            ${spot.globalRating ? `<span class="ml-2"><i class="fas fa-star text-yellow-500 mr-1" aria-hidden="true"></i>${spot.globalRating.toFixed(1)}</span>` : ''}
          </p>
        </div>
        <button
          type="button"
          class="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
          onclick="window.viewSpotFromCode(${spot.id})"
        >
          ${escapeHTML(t('viewSpot') || 'Voir')}
        </button>
      </div>
    </div>
  `;
  resultDiv.classList.remove('hidden');
}

/**
 * Get all stored share codes
 * @returns {Object[]} Array of { code, spotId } objects
 */
export function getAllShareCodes() {
  const stored = getStoredCodes();
  return Object.entries(stored.codeToSpot).map(([code, spotId]) => ({
    code,
    spotId,
  }));
}

/**
 * Delete a share code
 * @param {string} code - Share code to delete
 * @returns {boolean} True if deleted
 */
export function deleteShareCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const normalizedCode = code.trim().toUpperCase();
  const storedCodes = getStoredCodes();

  const spotId = storedCodes.codeToSpot[normalizedCode];
  if (!spotId) {
    return false;
  }

  delete storedCodes.codeToSpot[normalizedCode];
  delete storedCodes.spotToCode[spotId];
  saveStoredCodes(storedCodes);

  return true;
}

/**
 * Clear all share codes
 */
export function clearAllShareCodes() {
  try {
    localStorage.removeItem(SHARE_CODES_KEY);
  } catch (error) {
    console.warn('[SpotShareCode] Failed to clear codes:', error);
  }
}

/**
 * Generate share code and show it (called from badge button)
 * @param {string|number} spotId - Spot ID
 */
export function generateAndShowSpotCode(spotId) {
  const result = generateShareCode(spotId);

  if (result.success) {
    showToast(`${t('codeGenerated') || 'Code genere'}: ${result.code}`);

    // Try to update the UI if the badge element exists
    const badgeContainer = document.querySelector(`[data-spot-id="${spotId}"] .share-code-generate-btn`);
    if (badgeContainer) {
      badgeContainer.outerHTML = `
        <button
          type="button"
          class="share-code-badge inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          onclick="window.copySpotShareCode('${escapeHTML(result.code)}')"
          aria-label="${escapeHTML(t('copyCode') || 'Copier le code')} ${escapeHTML(result.code)}"
          title="${escapeHTML(result.code)}"
        >
          <i class="fas fa-share-alt" aria-hidden="true"></i>
          <span class="share-code-text">${escapeHTML(result.code)}</span>
        </button>
      `;
    }
  } else {
    showToast(t('codeGenerationFailed') || 'Erreur de generation', 'error');
  }
}

/**
 * View a spot from a share code lookup
 * @param {string|number} spotId - Spot ID
 */
export function viewSpotFromCode(spotId) {
  const spot = findSpotById(spotId);
  if (spot && typeof window !== 'undefined') {
    // Try to use global state or event
    if (typeof window.openSpotDetail === 'function') {
      window.openSpotDetail(spot);
    } else if (typeof window.setState === 'function') {
      window.setState({ selectedSpot: spot });
    }
  }
}

// Attach global handlers
if (typeof window !== 'undefined') {
  window.copySpotShareCode = copyCodeToClipboard;
  window.lookupShareCode = lookupShareCode;
  window.generateAndShowSpotCode = generateAndShowSpotCode;
  window.viewSpotFromCode = viewSpotFromCode;
}

export default {
  generateShareCode,
  resolveShareCode,
  getSpotByCode,
  getCodeForSpot,
  isValidShareCode,
  parseShareCode,
  copyCodeToClipboard,
  renderShareCode,
  renderShareCodeBadge,
  renderShareCodeLookup,
  lookupShareCode,
  getAllShareCodes,
  deleteShareCode,
  clearAllShareCodes,
  generateAndShowSpotCode,
  viewSpotFromCode,
};
