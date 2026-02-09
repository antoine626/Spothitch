/**
 * Closed Spots Service
 * Feature #84 - Spot ferme/inaccessible
 *
 * Permet de signaler et gerer les spots temporairement ou definitivement fermes.
 * Raisons: travaux, propriete privee, fermeture route, evenement temporaire, destruction
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Storage key for closed spots
const CLOSED_SPOTS_STORAGE_KEY = 'spothitch_closed_spots';

/**
 * Closure reasons enum
 */
export const ClosureReasons = {
  CONSTRUCTION: 'construction', // travaux
  PRIVATE_PROPERTY: 'private_property', // propriete privee
  ROAD_CLOSURE: 'road_closure', // fermeture route
  TEMPORARY_EVENT: 'temporary_event', // evenement temporaire
  DESTROYED: 'destroyed', // destruction
  OTHER: 'other', // autre
};

/**
 * Closure reason labels (i18n)
 */
export const ClosureReasonLabels = {
  fr: {
    [ClosureReasons.CONSTRUCTION]: 'Travaux',
    [ClosureReasons.PRIVATE_PROPERTY]: 'Propriete privee',
    [ClosureReasons.ROAD_CLOSURE]: 'Fermeture de route',
    [ClosureReasons.TEMPORARY_EVENT]: 'Evenement temporaire',
    [ClosureReasons.DESTROYED]: 'Destruction',
    [ClosureReasons.OTHER]: 'Autre',
  },
  en: {
    [ClosureReasons.CONSTRUCTION]: 'Construction',
    [ClosureReasons.PRIVATE_PROPERTY]: 'Private property',
    [ClosureReasons.ROAD_CLOSURE]: 'Road closure',
    [ClosureReasons.TEMPORARY_EVENT]: 'Temporary event',
    [ClosureReasons.DESTROYED]: 'Destroyed',
    [ClosureReasons.OTHER]: 'Other',
  },
  es: {
    [ClosureReasons.CONSTRUCTION]: 'Obras',
    [ClosureReasons.PRIVATE_PROPERTY]: 'Propiedad privada',
    [ClosureReasons.ROAD_CLOSURE]: 'Cierre de carretera',
    [ClosureReasons.TEMPORARY_EVENT]: 'Evento temporal',
    [ClosureReasons.DESTROYED]: 'Destruido',
    [ClosureReasons.OTHER]: 'Otro',
  },
};

/**
 * Closure reason icons
 */
export const ClosureReasonIcons = {
  [ClosureReasons.CONSTRUCTION]: '🚧',
  [ClosureReasons.PRIVATE_PROPERTY]: '🚫',
  [ClosureReasons.ROAD_CLOSURE]: '🛣️',
  [ClosureReasons.TEMPORARY_EVENT]: '🎪',
  [ClosureReasons.DESTROYED]: '💥',
  [ClosureReasons.OTHER]: '⚠️',
};

/**
 * Closure status enum
 */
export const ClosureStatus = {
  ACTIVE: 'active',
  REOPENED: 'reopened',
  PENDING_REVIEW: 'pending_review',
};

/**
 * Get stored closed spots from localStorage
 * @returns {Object} Closed spots data
 */
export function getStoredClosedSpots() {
  try {
    const stored = localStorage.getItem(CLOSED_SPOTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { closures: [], history: [] };
  } catch (e) {
    console.warn('[ClosedSpots] Failed to load closed spots:', e);
    return { closures: [], history: [] };
  }
}

/**
 * Save closed spots to localStorage
 * @param {Object} data - Closed spots data to save
 */
function saveClosedSpots(data) {
  try {
    localStorage.setItem(CLOSED_SPOTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[ClosedSpots] Failed to save closed spots:', e);
  }
}

/**
 * Report a spot as closed/inaccessible
 * @param {string|number} spotId - Spot ID to report
 * @param {string} reason - Closure reason from ClosureReasons
 * @param {string|Date|null} endDate - End date for temporary closure (null for permanent)
 * @param {Object} options - Additional options
 * @param {string} options.comment - Optional comment
 * @param {string} options.spotName - Spot name for display
 * @returns {Object} Result { success: boolean, error?: string, closure?: Object }
 */
export function reportClosedSpot(spotId, reason, endDate = null, options = {}) {
  const state = getState();
  const spotIdStr = String(spotId);

  // Validate reason
  if (!reason || !Object.values(ClosureReasons).includes(reason)) {
    return { success: false, error: 'invalid_reason' };
  }

  // Check if already closed
  if (isSpotClosed(spotIdStr)) {
    showToast('Ce spot est deja signale comme ferme', 'info');
    return { success: false, error: 'already_closed' };
  }

  // Parse end date if provided
  let parsedEndDate = null;
  if (endDate) {
    parsedEndDate = endDate instanceof Date ? endDate : new Date(endDate);
    if (isNaN(parsedEndDate.getTime())) {
      return { success: false, error: 'invalid_end_date' };
    }
    // Check if end date is in the past
    if (parsedEndDate <= new Date()) {
      return { success: false, error: 'end_date_in_past' };
    }
  }

  // Create closure record
  const data = getStoredClosedSpots();
  const now = Date.now();

  const closure = {
    id: `closure_${now}_${Math.random().toString(36).substring(2, 9)}`,
    spotId: spotIdStr,
    spotName: options.spotName || '',
    reason: reason,
    isTemporary: !!parsedEndDate,
    endDate: parsedEndDate ? parsedEndDate.toISOString() : null,
    reportedBy: state.user?.uid || 'anonymous',
    reporterName: state.username || 'Voyageur',
    comment: options.comment || '',
    status: ClosureStatus.ACTIVE,
    reportedAt: new Date().toISOString(),
    timestamp: now,
    confirmations: 1, // The reporter is the first to confirm
    confirmedBy: [state.user?.uid || 'anonymous'],
  };

  // Add to closures list
  data.closures.push(closure);

  // Save
  saveClosedSpots(data);

  // Update state
  const closedSpots = getClosedSpots();
  setState({ closedSpots: closedSpots.map(c => c.spotId) });

  // Show success toast
  const reasonLabel = getClosureReasonLabel(reason);
  showToast(`Spot signale comme ferme (${reasonLabel})`, 'warning');

  return { success: true, closure };
}

/**
 * Get all closed spots
 * @returns {Array} Array of active closure records
 */
export function getClosedSpots() {
  const data = getStoredClosedSpots();
  const now = new Date();

  // Filter only active closures (not reopened, and not expired if temporary)
  return data.closures.filter(closure => {
    if (closure.status !== ClosureStatus.ACTIVE) {
      return false;
    }
    // Check if temporary closure has expired
    if (closure.isTemporary && closure.endDate) {
      const endDate = new Date(closure.endDate);
      if (endDate <= now) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get all closure history (including reopened)
 * @returns {Array} Array of all closure records
 */
export function getClosureHistory() {
  const data = getStoredClosedSpots();
  return data.closures;
}

/**
 * Check if a spot is currently closed
 * @param {string|number} spotId - Spot ID to check
 * @returns {boolean} True if spot is closed
 */
export function isSpotClosed(spotId) {
  const spotIdStr = String(spotId);
  const closedSpots = getClosedSpots();
  return closedSpots.some(c => c.spotId === spotIdStr);
}

/**
 * Get closure info for a spot
 * @param {string|number} spotId - Spot ID
 * @returns {Object|null} Closure info or null if not closed
 */
export function getSpotClosure(spotId) {
  const spotIdStr = String(spotId);
  const closedSpots = getClosedSpots();
  return closedSpots.find(c => c.spotId === spotIdStr) || null;
}

/**
 * Reopen a closed spot
 * @param {string|number} spotId - Spot ID to reopen
 * @param {Object} options - Additional options
 * @param {string} options.comment - Optional reason for reopening
 * @returns {Object} Result { success: boolean, error?: string }
 */
export function reopenSpot(spotId, options = {}) {
  const state = getState();
  const spotIdStr = String(spotId);

  // Check if spot is closed
  if (!isSpotClosed(spotIdStr)) {
    return { success: false, error: 'spot_not_closed' };
  }

  const data = getStoredClosedSpots();
  const closureIndex = data.closures.findIndex(
    c => c.spotId === spotIdStr && c.status === ClosureStatus.ACTIVE
  );

  if (closureIndex === -1) {
    return { success: false, error: 'closure_not_found' };
  }

  // Update closure status
  data.closures[closureIndex] = {
    ...data.closures[closureIndex],
    status: ClosureStatus.REOPENED,
    reopenedAt: new Date().toISOString(),
    reopenedBy: state.user?.uid || 'anonymous',
    reopenerName: state.username || 'Voyageur',
    reopenComment: options.comment || '',
  };

  // Save
  saveClosedSpots(data);

  // Update state
  const closedSpots = getClosedSpots();
  setState({ closedSpots: closedSpots.map(c => c.spotId) });

  // Show toast
  showToast('Spot signale comme reouvert !', 'success');

  return { success: true };
}

/**
 * Confirm a closure report (increase confidence)
 * @param {string|number} spotId - Spot ID to confirm closure
 * @returns {Object} Result { success: boolean, error?: string, confirmations?: number }
 */
export function confirmClosure(spotId) {
  const state = getState();
  const spotIdStr = String(spotId);
  const userId = state.user?.uid || 'anonymous';

  // Check if spot is closed
  if (!isSpotClosed(spotIdStr)) {
    return { success: false, error: 'spot_not_closed' };
  }

  const data = getStoredClosedSpots();
  const closureIndex = data.closures.findIndex(
    c => c.spotId === spotIdStr && c.status === ClosureStatus.ACTIVE
  );

  if (closureIndex === -1) {
    return { success: false, error: 'closure_not_found' };
  }

  const closure = data.closures[closureIndex];

  // Check if user already confirmed
  if (closure.confirmedBy && closure.confirmedBy.includes(userId)) {
    return { success: false, error: 'already_confirmed' };
  }

  // Add confirmation
  data.closures[closureIndex] = {
    ...closure,
    confirmations: (closure.confirmations || 1) + 1,
    confirmedBy: [...(closure.confirmedBy || []), userId],
    lastConfirmedAt: new Date().toISOString(),
  };

  // Save
  saveClosedSpots(data);

  // Show toast
  showToast('Confirmation enregistree', 'success');

  return { success: true, confirmations: data.closures[closureIndex].confirmations };
}

/**
 * Contest a closure report
 * @param {string|number} spotId - Spot ID to contest
 * @param {string} comment - Reason for contesting
 * @returns {Object} Result { success: boolean, error?: string }
 */
export function contestClosure(spotId, comment = '') {
  const state = getState();
  const spotIdStr = String(spotId);
  const userId = state.user?.uid || 'anonymous';

  // Check if spot is closed
  if (!isSpotClosed(spotIdStr)) {
    return { success: false, error: 'spot_not_closed' };
  }

  const data = getStoredClosedSpots();
  const closureIndex = data.closures.findIndex(
    c => c.spotId === spotIdStr && c.status === ClosureStatus.ACTIVE
  );

  if (closureIndex === -1) {
    return { success: false, error: 'closure_not_found' };
  }

  const closure = data.closures[closureIndex];

  // Initialize contests array if needed
  if (!closure.contests) {
    closure.contests = [];
  }

  // Check if user already contested
  if (closure.contests.some(c => c.userId === userId)) {
    return { success: false, error: 'already_contested' };
  }

  // Add contest
  closure.contests.push({
    userId,
    userName: state.username || 'Voyageur',
    comment,
    contestedAt: new Date().toISOString(),
  });

  // If many contests, mark for review
  if (closure.contests.length >= 3) {
    closure.status = ClosureStatus.PENDING_REVIEW;
  }

  data.closures[closureIndex] = closure;

  // Save
  saveClosedSpots(data);

  // Show toast
  showToast('Contestation enregistree', 'info');

  return { success: true };
}

/**
 * Get closure reason label (localized)
 * @param {string} reason - Closure reason
 * @param {string} lang - Language code (default: fr)
 * @returns {string} Localized label
 */
export function getClosureReasonLabel(reason, lang = null) {
  const state = getState();
  const language = lang || state.lang || 'fr';
  const labels = ClosureReasonLabels[language] || ClosureReasonLabels.fr;
  return labels[reason] || reason;
}

/**
 * Get closure reason icon
 * @param {string} reason - Closure reason
 * @returns {string} Icon emoji
 */
export function getClosureReasonIcon(reason) {
  return ClosureReasonIcons[reason] || '⚠️';
}

/**
 * Get remaining days until spot reopens (for temporary closures)
 * @param {string|number} spotId - Spot ID
 * @returns {number|null} Days remaining or null if permanent/not closed
 */
export function getRemainingClosureDays(spotId) {
  const closure = getSpotClosure(spotId);
  if (!closure || !closure.isTemporary || !closure.endDate) {
    return null;
  }

  const endDate = new Date(closure.endDate);
  const now = new Date();
  const diffMs = endDate - now;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  return Math.max(0, diffDays);
}

/**
 * Get closed spots by reason
 * @param {string} reason - Closure reason
 * @returns {Array} Array of closures with that reason
 */
export function getClosedSpotsByReason(reason) {
  const closedSpots = getClosedSpots();
  return closedSpots.filter(c => c.reason === reason);
}

/**
 * Get closed spots statistics
 * @returns {Object} Statistics object
 */
export function getClosedSpotsStats() {
  const closedSpots = getClosedSpots();
  const history = getClosureHistory();

  const byReason = {};
  Object.values(ClosureReasons).forEach(reason => {
    byReason[reason] = closedSpots.filter(c => c.reason === reason).length;
  });

  return {
    totalClosed: closedSpots.length,
    totalHistory: history.length,
    temporary: closedSpots.filter(c => c.isTemporary).length,
    permanent: closedSpots.filter(c => !c.isTemporary).length,
    byReason,
    reopened: history.filter(c => c.status === ClosureStatus.REOPENED).length,
  };
}

/**
 * Render closed badge HTML for a spot
 * @param {Object|string|number} spot - Spot object or spot ID
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string} HTML string for the badge (empty if not closed)
 */
export function renderClosedBadge(spot, size = 'md') {
  const spotId = typeof spot === 'object' ? spot.id : spot;
  const closure = getSpotClosure(spotId);

  if (!closure) {
    return '';
  }

  const state = getState();
  const lang = state.lang || 'fr';
  const reasonLabel = getClosureReasonLabel(closure.reason, lang);
  const reasonIcon = getClosureReasonIcon(closure.reason);

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const sizeClass = sizes[size] || sizes.md;

  let endDateText = '';
  if (closure.isTemporary && closure.endDate) {
    const remainingDays = getRemainingClosureDays(spotId);
    if (remainingDays !== null) {
      if (lang === 'en') {
        endDateText = remainingDays === 1 ? ` (1 day left)` : ` (${remainingDays} days left)`;
      } else if (lang === 'es') {
        endDateText = remainingDays === 1 ? ` (1 dia restante)` : ` (${remainingDays} dias restantes)`;
      } else {
        endDateText = remainingDays === 1 ? ` (1 jour restant)` : ` (${remainingDays} jours restants)`;
      }
    }
  }

  const badgeColor = closure.isTemporary ? 'bg-amber-500' : 'bg-red-500';
  const titleText = lang === 'en' ? 'Closed' : lang === 'es' ? 'Cerrado' : 'Ferme';

  return `
    <span class="closed-badge inline-flex items-center gap-1 ${sizeClass} ${badgeColor} text-white rounded-full font-medium"
          title="${reasonLabel}${endDateText}"
          aria-label="${titleText}: ${reasonLabel}${endDateText}">
      <span aria-hidden="true">${reasonIcon}</span>
      <span>${titleText}</span>
    </span>
  `.trim();
}

/**
 * Render closed spot notice (more detailed than badge)
 * @param {string|number} spotId - Spot ID
 * @returns {string} HTML string for the notice
 */
export function renderClosedNotice(spotId) {
  const closure = getSpotClosure(spotId);

  if (!closure) {
    return '';
  }

  const state = getState();
  const lang = state.lang || 'fr';
  const reasonLabel = getClosureReasonLabel(closure.reason, lang);
  const reasonIcon = getClosureReasonIcon(closure.reason);

  const messages = {
    fr: {
      title: 'Spot temporairement ferme',
      permanentTitle: 'Spot ferme',
      reportedBy: 'Signale par',
      confirmations: 'confirmations',
      until: 'Jusqu\'au',
      reopen: 'Signaler comme reouvert',
      confirm: 'Confirmer la fermeture',
    },
    en: {
      title: 'Temporarily closed spot',
      permanentTitle: 'Closed spot',
      reportedBy: 'Reported by',
      confirmations: 'confirmations',
      until: 'Until',
      reopen: 'Report as reopened',
      confirm: 'Confirm closure',
    },
    es: {
      title: 'Spot temporalmente cerrado',
      permanentTitle: 'Spot cerrado',
      reportedBy: 'Reportado por',
      confirmations: 'confirmaciones',
      until: 'Hasta',
      reopen: 'Reportar como reabierto',
      confirm: 'Confirmar cierre',
    },
  };

  const m = messages[lang] || messages.fr;
  const title = closure.isTemporary ? m.title : m.permanentTitle;

  let endDateHtml = '';
  if (closure.isTemporary && closure.endDate) {
    const endDate = new Date(closure.endDate);
    const formattedDate = endDate.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    endDateHtml = `<p class="text-sm text-gray-600 dark:text-gray-400">${m.until} ${formattedDate}</p>`;
  }

  const bgColor = closure.isTemporary ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  const textColor = closure.isTemporary ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-200';

  return `
    <div class="closed-notice p-4 rounded-lg border ${bgColor}" role="alert">
      <div class="flex items-start gap-3">
        <span class="text-2xl" aria-hidden="true">${reasonIcon}</span>
        <div class="flex-1">
          <h4 class="font-semibold ${textColor}">${title}</h4>
          <p class="${textColor}">${reasonLabel}</p>
          ${endDateHtml}
          ${closure.comment ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"${closure.comment}"</p>` : ''}
          <p class="text-xs text-gray-500 mt-2">
            ${m.reportedBy} ${closure.reporterName} - ${closure.confirmations || 1} ${m.confirmations}
          </p>
          <div class="flex gap-2 mt-3">
            <button onclick="window.confirmSpotClosure('${closure.spotId}')"
                    class="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                    aria-label="${m.confirm}">
              ${m.confirm}
            </button>
            <button onclick="window.reopenSpot('${closure.spotId}')"
                    class="text-sm px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-700 dark:hover:bg-green-600 text-green-700 dark:text-green-200 rounded transition-colors"
                    aria-label="${m.reopen}">
              ${m.reopen}
            </button>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Check and auto-reopen expired temporary closures
 * Should be called periodically
 */
export function checkExpiredClosures() {
  const data = getStoredClosedSpots();
  const now = new Date();
  let updated = false;

  data.closures.forEach((closure, index) => {
    if (
      closure.status === ClosureStatus.ACTIVE &&
      closure.isTemporary &&
      closure.endDate
    ) {
      const endDate = new Date(closure.endDate);
      if (endDate <= now) {
        data.closures[index] = {
          ...closure,
          status: ClosureStatus.REOPENED,
          reopenedAt: now.toISOString(),
          reopenedBy: 'system',
          reopenerName: 'Automatic',
          reopenComment: 'Fermeture temporaire expiree',
        };
        updated = true;
      }
    }
  });

  if (updated) {
    saveClosedSpots(data);
    // Update state
    const closedSpots = getClosedSpots();
    setState({ closedSpots: closedSpots.map(c => c.spotId) });
  }

  return updated;
}

/**
 * Clear all closed spots (for testing/admin)
 */
export function clearAllClosures() {
  localStorage.removeItem(CLOSED_SPOTS_STORAGE_KEY);
  setState({ closedSpots: [] });
  console.log('[ClosedSpots] All closures cleared');
}

/**
 * Get all closure reasons
 * @returns {Array} Array of reason objects with id, label, icon
 */
export function getAllClosureReasons() {
  const state = getState();
  const lang = state.lang || 'fr';

  return Object.values(ClosureReasons).map(reason => ({
    id: reason,
    label: getClosureReasonLabel(reason, lang),
    icon: getClosureReasonIcon(reason),
  }));
}

// Export default object
export default {
  // Constants
  ClosureReasons,
  ClosureReasonLabels,
  ClosureReasonIcons,
  ClosureStatus,
  // Check functions
  isSpotClosed,
  getSpotClosure,
  // Getters
  getStoredClosedSpots,
  getClosedSpots,
  getClosureHistory,
  getClosedSpotsByReason,
  getClosedSpotsStats,
  getRemainingClosureDays,
  getClosureReasonLabel,
  getClosureReasonIcon,
  getAllClosureReasons,
  // Actions
  reportClosedSpot,
  reopenSpot,
  confirmClosure,
  contestClosure,
  checkExpiredClosures,
  clearAllClosures,
  // Render functions
  renderClosedBadge,
  renderClosedNotice,
};
