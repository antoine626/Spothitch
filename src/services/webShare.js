/**
 * Web Share Service
 * Native sharing functionality using Web Share API
 * with fallback to clipboard copy when not supported
 */

import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

/**
 * Check if Web Share API is supported
 * @returns {boolean} true if navigator.share is available
 */
export function isWebShareSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if file sharing is supported
 * @returns {boolean} true if navigator.canShare is available and supports files
 */
export function canShareFiles() {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
    return false;
  }

  // Test with a minimal file to check support
  try {
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Get base URL for sharing
 * @returns {string} Base URL of the application
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/Spothitch';
  }
  return 'https://spothitch.app';
}

/**
 * Copy text to clipboard as fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} true if successful
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
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error)
 */
function showToast(message, type = 'success') {
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

/**
 * Share content using Web Share API or fallback
 * @param {Object} data - Share data { title, text, url }
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
async function shareOrFallback(data) {
  const { title, text, url } = data;

  if (isWebShareSupported()) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'share' };
    } catch (error) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        return { success: false, method: 'share', error: 'cancelled' };
      }
      // Fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  const shareText = `${title}\n\n${text}\n\n${url}`;
  const copied = await copyToClipboard(shareText);

  if (copied) {
    showToast(t('linkCopied'));
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'clipboard', error: 'copy_failed' };
}

/**
 * Share a spot
 * @param {Object} spot - Spot object
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareSpot(spot) {
  if (!spot || !spot.id) {
    return { success: false, method: 'none', error: 'invalid_spot' };
  }

  const title = t('shareSpotTitle', { from: spot.from || '', to: spot.to || '' });
  const text = t('shareSpotText', {
    from: spot.from || '',
    to: spot.to || '',
    rating: spot.rating || 0,
  });
  const url = `${getBaseUrl()}/#/spot/${spot.id}`;

  return shareOrFallback({ title, text, url });
}

/**
 * Share a trip
 * @param {Object} trip - Trip object
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareTrip(trip) {
  if (!trip || !trip.id) {
    return { success: false, method: 'none', error: 'invalid_trip' };
  }

  const title = t('shareTripTitle', {
    from: trip.from || trip.start || '',
    to: trip.to || trip.end || '',
  });
  const text = t('shareTripText', {
    from: trip.from || trip.start || '',
    to: trip.to || trip.end || '',
    stops: trip.stops?.length || 0,
  });
  const url = `${getBaseUrl()}/#/trip/${trip.id}`;

  return shareOrFallback({ title, text, url });
}

/**
 * Share a user profile
 * @param {Object} user - User object
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareProfile(user) {
  if (!user || !user.id) {
    return { success: false, method: 'none', error: 'invalid_user' };
  }

  const username = user.username || user.displayName || t('anonymousUser');
  const title = t('shareProfileTitle', { username });
  const text = t('shareProfileText', {
    username,
    level: user.level || 1,
    spots: user.spotsCount || 0,
  });
  const url = `${getBaseUrl()}/#/profile/${user.id}`;

  return shareOrFallback({ title, text, url });
}

/**
 * Share an achievement/badge
 * @param {Object} badge - Badge object
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareAchievement(badge) {
  if (!badge || !badge.id) {
    return { success: false, method: 'none', error: 'invalid_badge' };
  }

  const title = t('shareAchievementTitle', { name: badge.name || '' });
  const text = t('shareAchievementText', {
    name: badge.name || '',
    description: badge.description || '',
  });
  const url = `${getBaseUrl()}/#/badge/${badge.id}`;

  return shareOrFallback({ title, text, url });
}

/**
 * Share custom content
 * @param {string} title - Share title
 * @param {string} text - Share text
 * @param {string} url - Share URL
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareCustom(title, text, url) {
  if (!title && !text && !url) {
    return { success: false, method: 'none', error: 'no_content' };
  }

  return shareOrFallback({
    title: title || '',
    text: text || '',
    url: url || getBaseUrl(),
  });
}

/**
 * Share with files (photos)
 * @param {Object} data - Share data { title, text, url }
 * @param {File[]} files - Array of File objects
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareWithFiles(data, files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return shareOrFallback(data);
  }

  if (!canShareFiles()) {
    // Fall back to sharing without files
    showToast(t('filesNotSupported'));
    return shareOrFallback(data);
  }

  const shareData = {
    title: data.title || '',
    text: data.text || '',
    url: data.url || '',
    files,
  };

  // Check if the specific share is allowed
  if (typeof navigator !== 'undefined' && navigator.canShare && !navigator.canShare(shareData)) {
    showToast(t('filesNotSupported'));
    return shareOrFallback(data);
  }

  try {
    await navigator.share(shareData);
    return { success: true, method: 'share_with_files' };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, method: 'share_with_files', error: 'cancelled' };
    }

    // Fall back to sharing without files
    return shareOrFallback(data);
  }
}

/**
 * Render share button HTML
 * @param {string} type - Share type (spot, trip, profile, badge, custom)
 * @param {Object} data - Data to share
 * @returns {string} HTML string for share button
 */
export function renderShareButton(type, data) {
  const validTypes = ['spot', 'trip', 'profile', 'badge', 'custom'];

  if (!validTypes.includes(type)) {
    console.warn(`[WebShare] Invalid share type: ${type}`);
    return '';
  }

  const dataAttr = data ? encodeURIComponent(JSON.stringify(data)) : '';
  const buttonLabel = t('share');
  const ariaLabel = t('shareAriaLabel', { type: t(type) || type });

  return `
    <button
      type="button"
      class="share-button flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      onclick="window.handleShare('${type}', '${dataAttr}')"
      aria-label="${ariaLabel}"
    >
      ${icon('share-2', 'w-5 h-5')}
      <span>${buttonLabel}</span>
    </button>
  `;
}

/**
 * Render compact share icon button
 * @param {string} type - Share type (spot, trip, profile, badge, custom)
 * @param {Object} data - Data to share
 * @returns {string} HTML string for compact share button
 */
export function renderShareIconButton(type, data) {
  const validTypes = ['spot', 'trip', 'profile', 'badge', 'custom'];

  if (!validTypes.includes(type)) {
    console.warn(`[WebShare] Invalid share type: ${type}`);
    return '';
  }

  const dataAttr = data ? encodeURIComponent(JSON.stringify(data)) : '';
  const ariaLabel = t('shareAriaLabel', { type: t(type) || type });

  return `
    <button
      type="button"
      class="share-icon-button p-2 text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500"
      onclick="window.handleShare('${type}', '${dataAttr}')"
      aria-label="${ariaLabel}"
    >
      ${icon('share-2', 'w-5 h-5')}
    </button>
  `;
}

/**
 * Global handler for share button clicks
 * @param {string} type - Share type
 * @param {string} encodedData - URL-encoded JSON data
 */
export async function handleShare(type, encodedData) {
  let data = {};

  if (encodedData) {
    try {
      data = JSON.parse(decodeURIComponent(encodedData));
    } catch {
      console.warn('[WebShare] Failed to parse share data');
    }
  }

  let result;

  switch (type) {
    case 'spot':
      result = await shareSpot(data);
      break;
    case 'trip':
      result = await shareTrip(data);
      break;
    case 'profile':
      result = await shareProfile(data);
      break;
    case 'badge':
      result = await shareAchievement(data);
      break;
    case 'custom':
      result = await shareCustom(data.title, data.text, data.url);
      break;
    default:
      console.warn(`[WebShare] Unknown share type: ${type}`);
      result = { success: false, method: 'none', error: 'unknown_type' };
  }

  if (result.success && result.method === 'share') {
    showToast(t('shareSuccess'));
  }

  return result;
}

// Attach global handler for onclick usage
if (typeof window !== 'undefined') {
  window.handleShare = handleShare;
}

export default {
  isWebShareSupported,
  canShareFiles,
  shareSpot,
  shareTrip,
  shareProfile,
  shareAchievement,
  shareCustom,
  shareWithFiles,
  renderShareButton,
  renderShareIconButton,
  handleShare,
};
