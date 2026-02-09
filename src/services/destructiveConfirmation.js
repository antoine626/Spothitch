/**
 * Destructive Confirmation Service
 * Feature #53 - Confirmation avant actions destructives
 *
 * Service pour confirmer les actions destructives avec timer de securite.
 * Principalement utilise pour la suppression de compte, mais configurable
 * pour d'autres actions destructives.
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key for confirmation history
const CONFIRMATION_HISTORY_KEY = 'spothitch_confirmation_history';

// Safety timer duration in milliseconds (5 seconds)
const SAFETY_TIMER_DURATION = 5000;

/**
 * Destructive action types enum
 */
export const DestructiveActions = {
  DELETE_ACCOUNT: {
    id: 'delete_account',
    label: 'Supprimer le compte',
    icon: 'fa-user-slash',
    severity: 'critical',
    requiresTimer: true,
    timerDuration: SAFETY_TIMER_DURATION,
    warningMessage: 'Cette action est irreversible. Toutes vos donnees seront supprimees definitivement.',
  },
  DELETE_SPOT: {
    id: 'delete_spot',
    label: 'Supprimer le spot',
    icon: 'fa-map-marker-slash',
    severity: 'high',
    requiresTimer: true,
    timerDuration: SAFETY_TIMER_DURATION,
    warningMessage: 'Ce spot sera supprime definitivement. Les autres utilisateurs ne pourront plus le voir.',
  },
  LEAVE_GROUP: {
    id: 'leave_group',
    label: 'Quitter le groupe',
    icon: 'fa-sign-out-alt',
    severity: 'medium',
    requiresTimer: false,
    timerDuration: 0,
    warningMessage: 'Vous ne pourrez plus acceder aux discussions et itineraires de ce groupe.',
  },
  BLOCK_USER: {
    id: 'block_user',
    label: 'Bloquer l\'utilisateur',
    icon: 'fa-ban',
    severity: 'medium',
    requiresTimer: false,
    timerDuration: 0,
    warningMessage: 'Cet utilisateur ne pourra plus vous contacter ni voir votre profil.',
  },
  DELETE_ALL_DATA: {
    id: 'delete_all_data',
    label: 'Supprimer toutes les donnees',
    icon: 'fa-trash-alt',
    severity: 'critical',
    requiresTimer: true,
    timerDuration: SAFETY_TIMER_DURATION,
    warningMessage: 'Toutes vos donnees locales seront effacees. Cette action est irreversible.',
  },
  CLEAR_HISTORY: {
    id: 'clear_history',
    label: 'Effacer l\'historique',
    icon: 'fa-history',
    severity: 'low',
    requiresTimer: false,
    timerDuration: 0,
    warningMessage: 'Votre historique de check-ins sera efface.',
  },
};

/**
 * Severity levels with colors
 */
export const SeverityLevels = {
  low: { color: 'yellow', bgClass: 'bg-yellow-500', textClass: 'text-yellow-400' },
  medium: { color: 'orange', bgClass: 'bg-orange-500', textClass: 'text-orange-400' },
  high: { color: 'red', bgClass: 'bg-danger-500', textClass: 'text-danger-400' },
  critical: { color: 'red', bgClass: 'bg-danger-600', textClass: 'text-danger-300' },
};

// Internal state for current confirmation
let currentConfirmation = null;
let timerInterval = null;
let timerStartTime = null;

/**
 * Get action config by ID
 * @param {string} actionId - Action ID
 * @returns {Object|null} Action config or null
 */
export function getActionConfig(actionId) {
  if (!actionId) return null;
  return Object.values(DestructiveActions).find(a => a.id === actionId) || null;
}

/**
 * Check if an action requires confirmation
 * @param {string} actionId - Action ID to check
 * @returns {boolean} True if the action requires confirmation
 */
export function requiresConfirmation(actionId) {
  const config = getActionConfig(actionId);
  return config !== null;
}

/**
 * Check if an action requires a safety timer
 * @param {string} actionId - Action ID to check
 * @returns {boolean} True if the action requires a timer
 */
export function requiresTimer(actionId) {
  const config = getActionConfig(actionId);
  return config ? config.requiresTimer : false;
}

/**
 * Get timer duration for an action
 * @param {string} actionId - Action ID
 * @returns {number} Timer duration in milliseconds
 */
export function getTimerDuration(actionId) {
  const config = getActionConfig(actionId);
  return config ? config.timerDuration : 0;
}

/**
 * Get severity level for an action
 * @param {string} actionId - Action ID
 * @returns {string} Severity level (low, medium, high, critical)
 */
export function getSeverityLevel(actionId) {
  const config = getActionConfig(actionId);
  return config ? config.severity : 'low';
}

/**
 * Get current confirmation state
 * @returns {Object|null} Current confirmation or null
 */
export function getCurrentConfirmation() {
  return currentConfirmation;
}

/**
 * Get remaining time on the safety timer
 * @returns {number} Remaining time in milliseconds, 0 if timer complete or not active
 */
export function getRemainingTime() {
  if (!currentConfirmation || !timerStartTime) return 0;

  const config = getActionConfig(currentConfirmation.actionId);
  if (!config || !config.requiresTimer) return 0;

  const elapsed = Date.now() - timerStartTime;
  const remaining = config.timerDuration - elapsed;

  return Math.max(0, remaining);
}

/**
 * Check if the safety timer has completed
 * @returns {boolean} True if timer is complete or not required
 */
export function isTimerComplete() {
  if (!currentConfirmation) return false;

  const config = getActionConfig(currentConfirmation.actionId);
  if (!config) return false;

  // If timer not required, it's always "complete"
  if (!config.requiresTimer) return true;

  return getRemainingTime() === 0;
}

/**
 * Start a destructive action confirmation
 * @param {string} actionId - ID of the destructive action
 * @param {Object} options - Additional options
 * @param {string} options.targetId - ID of the target (e.g., spot ID, user ID)
 * @param {string} options.targetName - Display name of the target
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Callback when cancelled
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Result with success status and confirmation data
 */
export function confirmDestructiveAction(actionId, options = {}) {
  const config = getActionConfig(actionId);

  if (!config) {
    return { success: false, error: 'invalid_action' };
  }

  // Handle null/undefined options
  const opts = options || {};

  // Cancel any existing confirmation
  if (currentConfirmation) {
    cancelConfirmation();
  }

  // Create confirmation object
  currentConfirmation = {
    actionId,
    config,
    targetId: opts.targetId || null,
    targetName: opts.targetName || '',
    onConfirm: opts.onConfirm || null,
    onCancel: opts.onCancel || null,
    metadata: opts.metadata || {},
    createdAt: new Date().toISOString(),
    confirmed: false,
  };

  // Start timer if required
  if (config.requiresTimer) {
    timerStartTime = Date.now();
    timerInterval = setInterval(() => {
      // Notify UI to update timer display
      const remaining = getRemainingTime();
      if (remaining === 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        // Dispatch event for UI update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('destructiveTimerComplete', {
            detail: { actionId, targetId: currentConfirmation?.targetId }
          }));
        }
      }
    }, 100);
  }

  // Update state to show modal
  setState({
    showDestructiveConfirmation: true,
    destructiveConfirmationAction: actionId,
    destructiveConfirmationTarget: opts.targetId,
  });

  return { success: true, confirmation: currentConfirmation };
}

/**
 * Execute the confirmed action
 * @returns {Object} Result with success status
 */
export function executeConfirmation() {
  if (!currentConfirmation) {
    return { success: false, error: 'no_active_confirmation' };
  }

  // Check timer if required
  if (!isTimerComplete()) {
    const remaining = Math.ceil(getRemainingTime() / 1000);
    showToast(
      t('waitForTimer') || `Veuillez attendre ${remaining} secondes avant de confirmer`,
      'warning'
    );
    return { success: false, error: 'timer_not_complete', remainingSeconds: remaining };
  }

  // Mark as confirmed
  currentConfirmation.confirmed = true;
  currentConfirmation.confirmedAt = new Date().toISOString();

  // Store in history
  saveConfirmationToHistory(currentConfirmation);

  // Call onConfirm callback if provided
  if (typeof currentConfirmation.onConfirm === 'function') {
    try {
      currentConfirmation.onConfirm(currentConfirmation);
    } catch (error) {
      console.error('Error in confirmation callback:', error);
    }
  }

  const result = { success: true, confirmation: { ...currentConfirmation } };

  // Clean up
  cleanup();

  // Show success toast based on action
  const actionLabel = currentConfirmation?.config?.label || 'Action';
  showToast(t('actionConfirmed') || `${actionLabel} confirme`, 'success');

  return result;
}

/**
 * Cancel the current confirmation
 * @returns {Object} Result with success status
 */
export function cancelConfirmation() {
  if (!currentConfirmation) {
    return { success: false, error: 'no_active_confirmation' };
  }

  // Call onCancel callback if provided
  if (typeof currentConfirmation.onCancel === 'function') {
    try {
      currentConfirmation.onCancel(currentConfirmation);
    } catch (error) {
      console.error('Error in cancel callback:', error);
    }
  }

  cleanup();

  showToast(t('actionCancelled') || 'Action annulee', 'info');

  return { success: true };
}

/**
 * Clean up internal state
 */
function cleanup() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStartTime = null;
  currentConfirmation = null;

  setState({
    showDestructiveConfirmation: false,
    destructiveConfirmationAction: null,
    destructiveConfirmationTarget: null,
  });
}

/**
 * Save confirmation to history (for audit/logging)
 * @param {Object} confirmation - Confirmation data
 */
function saveConfirmationToHistory(confirmation) {
  try {
    const history = getConfirmationHistory();
    history.push({
      actionId: confirmation.actionId,
      targetId: confirmation.targetId,
      targetName: confirmation.targetName,
      confirmedAt: confirmation.confirmedAt,
      metadata: confirmation.metadata,
    });

    // Keep only last 50 entries
    const trimmedHistory = history.slice(-50);
    localStorage.setItem(CONFIRMATION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving confirmation history:', error);
  }
}

/**
 * Get confirmation history
 * @returns {Array} Array of past confirmations
 */
export function getConfirmationHistory() {
  try {
    const data = localStorage.getItem(CONFIRMATION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading confirmation history:', error);
    return [];
  }
}

/**
 * Clear confirmation history
 * @returns {Object} Result with success status
 */
export function clearConfirmationHistory() {
  try {
    localStorage.removeItem(CONFIRMATION_HISTORY_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing confirmation history:', error);
    return { success: false, error: 'storage_error' };
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format time remaining for display
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimeRemaining(milliseconds) {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${seconds}s`;
}

/**
 * Render the confirmation modal HTML
 * @param {Object} config - Modal configuration (from confirmDestructiveAction result)
 * @returns {string} HTML string of confirmation modal
 */
export function renderConfirmationModal(config = null) {
  const confirmation = config || currentConfirmation;

  if (!confirmation) {
    return '';
  }

  const actionConfig = confirmation.config || getActionConfig(confirmation.actionId);
  if (!actionConfig) {
    return '';
  }

  const severityStyle = SeverityLevels[actionConfig.severity] || SeverityLevels.medium;
  const targetDisplay = confirmation.targetName || confirmation.targetId || '';
  const hasTimer = actionConfig.requiresTimer;
  const remaining = getRemainingTime();
  const timerComplete = isTimerComplete();

  // Determine gradient colors based on severity
  let gradientColors = 'from-danger-500 to-orange-500';
  if (actionConfig.severity === 'critical') {
    gradientColors = 'from-danger-600 to-red-700';
  } else if (actionConfig.severity === 'medium') {
    gradientColors = 'from-orange-500 to-yellow-500';
  } else if (actionConfig.severity === 'low') {
    gradientColors = 'from-yellow-500 to-amber-500';
  }

  return `
    <div
      class="destructive-confirmation-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)cancelDestructiveConfirmation()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destructive-modal-title"
    >
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <!-- Header -->
        <div class="bg-gradient-to-r ${gradientColors} p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="destructive-modal-title" class="text-xl font-bold text-white">
                <i class="fas ${escapeHTML(actionConfig.icon)} mr-2"></i>
                ${escapeHTML(actionConfig.label)}
              </h2>
              ${targetDisplay ? `<p class="text-white/80 text-sm mt-1">${escapeHTML(targetDisplay)}</p>` : ''}
            </div>
            <button
              onclick="cancelDestructiveConfirmation()"
              class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
              aria-label="${escapeHTML(t('close') || 'Fermer')}"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Warning Content -->
        <div class="p-6">
          <!-- Warning icon -->
          <div class="flex items-center gap-3 mb-4 p-3 bg-danger-500/10 rounded-lg border border-danger-500/20">
            <div class="w-10 h-10 rounded-full ${severityStyle.bgClass}/20 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-exclamation-triangle ${severityStyle.textClass}"></i>
            </div>
            <p class="text-slate-300 text-sm">
              ${escapeHTML(actionConfig.warningMessage)}
            </p>
          </div>

          ${hasTimer ? `
          <!-- Safety Timer -->
          <div class="mb-4 p-4 bg-white/5 rounded-lg" id="safety-timer-container">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-slate-400">
                <i class="fas fa-clock mr-1"></i>
                ${escapeHTML(t('safetyTimer') || 'Delai de securite')}
              </span>
              <span id="timer-display" class="text-sm font-mono ${timerComplete ? 'text-success-400' : 'text-warning-400'}">
                ${timerComplete ? '✓' : formatTimeRemaining(remaining)}
              </span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                id="timer-progress"
                class="h-full ${timerComplete ? 'bg-success-500' : 'bg-warning-500'} transition-all duration-100"
                style="width: ${timerComplete ? '100' : Math.floor((1 - remaining / actionConfig.timerDuration) * 100)}%"
              ></div>
            </div>
            ${!timerComplete ? `
            <p class="text-xs text-slate-500 mt-2">
              ${escapeHTML(t('timerExplanation') || 'Ce delai vous permet de reflechir avant de confirmer cette action irreversible.')}
            </p>
            ` : ''}
          </div>
          ` : ''}

          <!-- Severity badge -->
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs text-slate-500">${escapeHTML(t('severity') || 'Severite')}:</span>
            <span class="px-2 py-1 text-xs rounded-full ${severityStyle.bgClass}/20 ${severityStyle.textClass}">
              ${escapeHTML(actionConfig.severity.toUpperCase())}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-gray-800 flex gap-3">
          <button
            onclick="cancelDestructiveConfirmation()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            <i class="fas fa-arrow-left mr-2"></i>
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="executeDestructiveConfirmation()"
            class="btn flex-1 btn-danger ${!timerComplete ? 'opacity-50 cursor-not-allowed' : ''}"
            id="confirm-destructive-btn"
            ${!timerComplete ? 'disabled' : ''}
            aria-disabled="${!timerComplete}"
          >
            <i class="fas fa-check mr-2"></i>
            ${escapeHTML(t('confirm') || 'Confirmer')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a compact confirmation button with built-in confirmation
 * @param {string} actionId - Action ID
 * @param {string} targetId - Target ID
 * @param {string} targetName - Target display name
 * @param {Object} options - Additional options
 * @returns {string} HTML string of the button
 */
export function renderDestructiveButton(actionId, targetId = '', targetName = '', options = {}) {
  const config = getActionConfig(actionId);

  if (!config) {
    return '';
  }

  const severityStyle = SeverityLevels[config.severity] || SeverityLevels.medium;
  const buttonSize = options.size || 'md';
  const buttonClass = options.className || '';

  const sizeClasses = {
    sm: 'btn-sm text-xs',
    md: 'btn text-sm',
    lg: 'btn-lg text-base',
  };

  return `
    <button
      onclick="openDestructiveConfirmation('${escapeHTML(actionId)}', '${escapeHTML(targetId)}', '${escapeHTML(targetName)}')"
      class="${sizeClasses[buttonSize]} ${severityStyle.bgClass}/20 hover:${severityStyle.bgClass}/30 ${severityStyle.textClass} ${buttonClass}"
      aria-label="${escapeHTML(config.label)} ${escapeHTML(targetName)}"
      data-action="${escapeHTML(actionId)}"
      data-target="${escapeHTML(targetId)}"
    >
      <i class="fas ${escapeHTML(config.icon)} mr-1"></i>
      ${escapeHTML(config.label)}
    </button>
  `;
}

/**
 * Get all available destructive actions
 * @returns {Array} Array of action configs
 */
export function getDestructiveActions() {
  return Object.values(DestructiveActions);
}

/**
 * Get actions by severity level
 * @param {string} severity - Severity level to filter by
 * @returns {Array} Array of matching action configs
 */
export function getActionsBySeverity(severity) {
  if (!severity) return [];
  return Object.values(DestructiveActions).filter(a => a.severity === severity);
}

/**
 * Get statistics about destructive actions
 * @returns {Object} Statistics object
 */
export function getDestructiveActionStats() {
  const history = getConfirmationHistory();

  // Group by action
  const actionCounts = {};
  history.forEach(entry => {
    actionCounts[entry.actionId] = (actionCounts[entry.actionId] || 0) + 1;
  });

  return {
    totalConfirmed: history.length,
    actionBreakdown: actionCounts,
    lastConfirmation: history.length > 0 ? history[history.length - 1] : null,
    availableActions: Object.keys(DestructiveActions).length,
  };
}

// Global handlers for onclick events
if (typeof window !== 'undefined') {
  window.openDestructiveConfirmation = (actionId, targetId, targetName) => {
    confirmDestructiveAction(actionId, {
      targetId,
      targetName,
    });
  };

  window.cancelDestructiveConfirmation = () => {
    cancelConfirmation();
  };

  window.executeDestructiveConfirmation = () => {
    executeConfirmation();
  };
}

// Export default with all functions
export default {
  DestructiveActions,
  SeverityLevels,
  getActionConfig,
  requiresConfirmation,
  requiresTimer,
  getTimerDuration,
  getSeverityLevel,
  getCurrentConfirmation,
  getRemainingTime,
  isTimerComplete,
  confirmDestructiveAction,
  executeConfirmation,
  cancelConfirmation,
  getConfirmationHistory,
  clearConfirmationHistory,
  renderConfirmationModal,
  renderDestructiveButton,
  getDestructiveActions,
  getActionsBySeverity,
  getDestructiveActionStats,
};
