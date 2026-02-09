/**
 * In-App Feedback Service
 * Feature #275 - Service pour collecter les retours utilisateurs
 *
 * Gestion des feedbacks utilisateurs avec stockage local,
 * capture de screenshot optionnel, et infos device/version.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key for feedback
const FEEDBACK_STORAGE_KEY = 'spothitch_user_feedback';

// App version (should match package.json)
const APP_VERSION = '2.0.0';

/**
 * Feedback type enum
 */
export const FeedbackType = {
  BUG: 'bug',
  SUGGESTION: 'suggestion',
  COMPLIMENT: 'compliment',
  QUESTION: 'question',
  FEATURE_REQUEST: 'feature_request',
  IMPROVEMENT: 'improvement',
  GENERAL: 'general',
  COMPLAINT: 'complaint',
};

/**
 * Rate limit: max feedbacks per day
 */
const MAX_FEEDBACK_PER_DAY = 5;

/**
 * Feedback type metadata with labels and icons
 */
export const FeedbackTypes = {
  bug: {
    id: 'bug',
    label: 'Bug / Probleme',
    icon: 'fa-bug',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Quelque chose ne fonctionne pas comme prevu',
    emoji: '🐛',
  },
  suggestion: {
    id: 'suggestion',
    label: 'Suggestion',
    icon: 'fa-lightbulb',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    description: 'Une idee pour ameliorer l\'application',
    emoji: '💡',
  },
  compliment: {
    id: 'compliment',
    label: 'Compliment',
    icon: 'fa-heart',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    description: 'Quelque chose que tu aimes dans l\'app',
    emoji: '💖',
  },
  question: {
    id: 'question',
    label: 'Question',
    icon: 'fa-question-circle',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Besoin d\'aide ou d\'explications',
    emoji: '❓',
  },
  feature_request: {
    id: 'feature_request',
    label: 'Demande de fonctionnalite',
    icon: 'fa-plus-circle',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Proposer une nouvelle fonctionnalite',
    emoji: '🚀',
  },
  improvement: {
    id: 'improvement',
    label: 'Amelioration',
    icon: 'fa-arrow-up',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    description: 'Ameliorer une fonctionnalite existante',
    emoji: '📈',
  },
  general: {
    id: 'general',
    label: 'General',
    icon: 'fa-comment',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    description: 'Retour general sur l\'application',
    emoji: '💬',
  },
  complaint: {
    id: 'complaint',
    label: 'Plainte',
    icon: 'fa-exclamation-triangle',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    description: 'Signaler un probleme ou une insatisfaction',
    emoji: '⚠️',
  },
};

/**
 * Feedback status enum
 */
export const FeedbackStatus = {
  PENDING: 'pending',
  READ: 'read',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

/**
 * Get feedback from storage
 * @returns {Array} Array of feedback objects
 */
function getFeedbackFromStorage() {
  try {
    const data = Storage.get(FEEDBACK_STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[InAppFeedback] Error reading feedback:', error);
    return [];
  }
}

/**
 * Save feedback to storage
 * @param {Array} feedbackList - Array of feedback objects
 */
function saveFeedbackToStorage(feedbackList) {
  try {
    Storage.set(FEEDBACK_STORAGE_KEY, feedbackList);
    setState({ userFeedback: feedbackList });
  } catch (error) {
    console.error('[InAppFeedback] Error saving feedback:', error);
  }
}

/**
 * Generate unique feedback ID
 * @returns {string} Unique feedback ID
 */
function generateFeedbackId() {
  return `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get device information
 * @returns {Object} Device info object
 */
export function getDeviceInfo() {
  const info = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    screenWidth: typeof screen !== 'undefined' ? screen.width : 0,
    screenHeight: typeof screen !== 'undefined' ? screen.height : 0,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory || 'unknown' : 'unknown',
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'unknown' : 'unknown',
    touchSupport: typeof navigator !== 'undefined' ? 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0 : false,
  };

  // Detect browser
  const ua = info.userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) {
    info.browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    info.browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    info.browser = 'Safari';
  } else if (ua.includes('edg')) {
    info.browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    info.browser = 'Opera';
  } else {
    info.browser = 'Unknown';
  }

  // Detect OS
  if (ua.includes('windows')) {
    info.os = 'Windows';
  } else if (ua.includes('mac')) {
    info.os = 'macOS';
  } else if (ua.includes('linux')) {
    info.os = 'Linux';
  } else if (ua.includes('android')) {
    info.os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    info.os = 'iOS';
  } else {
    info.os = 'Unknown';
  }

  // Detect device type
  if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet')) {
    info.deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    info.deviceType = 'tablet';
  } else {
    info.deviceType = 'desktop';
  }

  return info;
}

/**
 * Get app version
 * @returns {string} App version string
 */
export function getAppVersion() {
  return APP_VERSION;
}

/**
 * Get all feedback types
 * @returns {Array} Array of feedback type objects
 */
export function getFeedbackTypes() {
  return Object.values(FeedbackTypes);
}

/**
 * Get feedback type by ID
 * @param {string} typeId - Type ID
 * @returns {Object|null} Feedback type object or null
 */
export function getFeedbackTypeById(typeId) {
  if (!typeId) return null;
  return FeedbackTypes[typeId] || null;
}

/**
 * Validate feedback type
 * @param {string} type - Feedback type
 * @returns {boolean} True if valid
 */
export function isValidFeedbackType(type) {
  return type && Object.values(FeedbackType).includes(type);
}

/**
 * Submit new feedback
 * @param {string} type - Feedback type (bug, suggestion, compliment, question)
 * @param {string} message - Feedback message
 * @param {Object} metadata - Optional metadata (screenshot, page, etc.)
 * @returns {Object} Result object with success status and feedback data
 */
export function submitFeedback(type, message, metadata = {}) {
  // Validate type
  if (!isValidFeedbackType(type)) {
    return { success: false, error: 'invalid_type' };
  }

  // Validate message
  if (!message || typeof message !== 'string') {
    return { success: false, error: 'message_required' };
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return { success: false, error: 'message_empty' };
  }

  if (trimmedMessage.length < 10) {
    return { success: false, error: 'message_too_short' };
  }

  if (trimmedMessage.length > 2000) {
    return { success: false, error: 'message_too_long' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const username = state.username || 'Anonyme';

  // Get device info
  const deviceInfo = getDeviceInfo();

  // Build feedback object
  const feedback = {
    id: generateFeedbackId(),
    type,
    message: trimmedMessage,
    userId,
    username,
    userAvatar: state.avatar || '🤙',
    status: FeedbackStatus.PENDING,
    appVersion: getAppVersion(),
    deviceInfo,
    currentPage: metadata.page || state.activeTab || 'unknown',
    screenshot: metadata.screenshot || null,
    metadata: {
      ...metadata,
      screenshot: undefined, // Don't duplicate screenshot in metadata
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to storage
  const feedbackList = getFeedbackFromStorage();
  feedbackList.push(feedback);
  saveFeedbackToStorage(feedbackList);

  // Show success toast
  const typeInfo = getFeedbackTypeById(type);
  showToast(
    t('feedbackSubmitted') || `Merci pour ton feedback ! ${typeInfo?.emoji || '🙏'}`,
    'success'
  );

  return { success: true, feedback };
}

/**
 * Get feedback history for current user
 * @param {Object} options - Filter options
 * @returns {Array} Array of feedback objects
 */
export function getFeedbackHistory(options = {}) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const feedbackList = getFeedbackFromStorage();

  let filtered = feedbackList.filter(f => f.userId === userId);

  // Filter by type
  if (options.type && isValidFeedbackType(options.type)) {
    filtered = filtered.filter(f => f.type === options.type);
  }

  // Filter by status
  if (options.status && Object.values(FeedbackStatus).includes(options.status)) {
    filtered = filtered.filter(f => f.status === options.status);
  }

  // Filter by date range
  if (options.startDate) {
    const start = new Date(options.startDate);
    filtered = filtered.filter(f => new Date(f.createdAt) >= start);
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    filtered = filtered.filter(f => new Date(f.createdAt) <= end);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Limit results
  if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get a specific feedback by ID
 * @param {string} feedbackId - Feedback ID
 * @returns {Object|null} Feedback object or null
 */
export function getFeedbackById(feedbackId) {
  if (!feedbackId) return null;

  const feedbackList = getFeedbackFromStorage();
  return feedbackList.find(f => f.id === feedbackId) || null;
}

/**
 * Get feedback statistics
 * @returns {Object} Statistics object
 */
export function getFeedbackStats() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const feedbackList = getFeedbackFromStorage();

  const userFeedback = feedbackList.filter(f => f.userId === userId);

  const stats = {
    total: userFeedback.length,
    byType: {
      bug: 0,
      suggestion: 0,
      compliment: 0,
      question: 0,
      feature_request: 0,
      improvement: 0,
      general: 0,
      complaint: 0,
    },
    byStatus: {
      pending: 0,
      read: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    },
    lastSubmitted: null,
    averageMessageLength: 0,
  };

  if (userFeedback.length === 0) {
    return stats;
  }

  let totalLength = 0;

  userFeedback.forEach(feedback => {
    // Count by type
    if (stats.byType[feedback.type] !== undefined) {
      stats.byType[feedback.type]++;
    }

    // Count by status
    if (stats.byStatus[feedback.status] !== undefined) {
      stats.byStatus[feedback.status]++;
    }

    // Sum message lengths
    totalLength += feedback.message.length;
  });

  // Calculate average message length
  stats.averageMessageLength = Math.round(totalLength / userFeedback.length);

  // Get last submitted date
  const sorted = [...userFeedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  stats.lastSubmitted = sorted[0]?.createdAt || null;

  return stats;
}

/**
 * Delete a feedback (only own feedback)
 * @param {string} feedbackId - Feedback ID
 * @returns {Object} Result with success status
 */
export function deleteFeedback(feedbackId) {
  if (!feedbackId) {
    return { success: false, error: 'feedback_id_required' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const feedbackList = getFeedbackFromStorage();
  const feedbackIndex = feedbackList.findIndex(f => f.id === feedbackId);

  if (feedbackIndex === -1) {
    return { success: false, error: 'feedback_not_found' };
  }

  const feedback = feedbackList[feedbackIndex];

  // Check ownership
  if (feedback.userId !== userId) {
    return { success: false, error: 'not_owner' };
  }

  // Remove from list
  feedbackList.splice(feedbackIndex, 1);
  saveFeedbackToStorage(feedbackList);

  showToast(t('feedbackDeleted') || 'Feedback supprime', 'success');

  return { success: true };
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
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Get status label
 * @param {string} status - Status value
 * @returns {string} Status label
 */
function getStatusLabel(status) {
  const labels = {
    [FeedbackStatus.PENDING]: t('feedbackStatusPending') || 'En attente',
    [FeedbackStatus.READ]: t('feedbackStatusRead') || 'Lu',
    [FeedbackStatus.IN_PROGRESS]: t('feedbackStatusInProgress') || 'En cours',
    [FeedbackStatus.RESOLVED]: t('feedbackStatusResolved') || 'Resolu',
    [FeedbackStatus.CLOSED]: t('feedbackStatusClosed') || 'Ferme',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} CSS class
 */
function getStatusColor(status) {
  const colors = {
    [FeedbackStatus.PENDING]: 'text-yellow-400 bg-yellow-500/20',
    [FeedbackStatus.READ]: 'text-blue-400 bg-blue-500/20',
    [FeedbackStatus.IN_PROGRESS]: 'text-purple-400 bg-purple-500/20',
    [FeedbackStatus.RESOLVED]: 'text-green-400 bg-green-500/20',
    [FeedbackStatus.CLOSED]: 'text-slate-400 bg-slate-500/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Render feedback form HTML
 * @param {Object} options - Form options (preselectedType, placeholder)
 * @returns {string} HTML string
 */
export function renderFeedbackForm(options = {}) {
  const types = getFeedbackTypes();
  const preselectedType = options.preselectedType || '';

  return `
    <div
      class="feedback-form bg-gray-900 rounded-2xl p-6"
      role="form"
      aria-labelledby="feedback-form-title"
    >
      <h3 id="feedback-form-title" class="text-xl font-bold text-white mb-4">
        <i class="fas fa-comment-dots mr-2 text-primary-400"></i>
        ${escapeHTML(t('sendFeedback') || 'Envoyer un feedback')}
      </h3>

      <p class="text-slate-400 text-sm mb-4">
        ${escapeHTML(t('feedbackDescription') || 'Ton avis nous aide a ameliorer l\'application !')}
      </p>

      <!-- Type selection -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2">
          ${escapeHTML(t('feedbackType') || 'Type de feedback')} *
        </label>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="${escapeHTML(t('feedbackType') || 'Type de feedback')}">
          ${types.map(type => `
            <button
              type="button"
              onclick="selectFeedbackType('${escapeHTML(type.id)}')"
              class="feedback-type-btn p-3 rounded-xl border-2 transition-all ${preselectedType === type.id ? `border-primary-500 ${type.bgColor}` : 'border-white/10 hover:border-white/30'}"
              data-type="${escapeHTML(type.id)}"
              role="radio"
              aria-checked="${preselectedType === type.id ? 'true' : 'false'}"
              aria-label="${escapeHTML(type.label)}"
            >
              <div class="flex items-center gap-2">
                <span class="text-2xl">${type.emoji}</span>
                <div class="text-left">
                  <div class="${type.color} font-medium text-sm">${escapeHTML(type.label)}</div>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
        <input type="hidden" id="feedback-type-input" value="${escapeHTML(preselectedType)}">
      </div>

      <!-- Message textarea -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2" for="feedback-message">
          ${escapeHTML(t('feedbackMessage') || 'Ton message')} *
        </label>
        <textarea
          id="feedback-message"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows="4"
          minlength="10"
          maxlength="2000"
          placeholder="${escapeHTML(options.placeholder || t('feedbackPlaceholder') || 'Decris ton feedback en detail...')}"
          oninput="updateFeedbackCharsCount()"
          required
        ></textarea>
        <p class="text-xs text-slate-500 mt-1">
          <span id="feedback-chars-count">0</span>/2000 ${escapeHTML(t('characters') || 'caracteres')}
          <span class="text-slate-600 ml-2">(min. 10)</span>
        </p>
      </div>

      <!-- Screenshot option -->
      <div class="mb-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="feedback-include-screenshot"
            class="w-5 h-5 rounded bg-white/5 border-white/20 text-primary-500 focus:ring-primary-500"
          >
          <span class="text-white">
            <i class="fas fa-camera mr-2 text-slate-400"></i>
            ${escapeHTML(t('includeScreenshot') || 'Inclure une capture d\'ecran')}
          </span>
        </label>
        <p class="text-xs text-slate-500 ml-8 mt-1">
          ${escapeHTML(t('screenshotHelp') || 'Aide a mieux comprendre le probleme')}
        </p>
        <div id="feedback-screenshot-preview" class="hidden mt-2 ml-8">
          <img id="feedback-screenshot-img" class="max-w-xs rounded-lg border border-white/10" alt="Screenshot preview">
          <button
            type="button"
            onclick="removeFeedbackScreenshot()"
            class="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            <i class="fas fa-times mr-1"></i>
            ${escapeHTML(t('removeScreenshot') || 'Supprimer')}
          </button>
        </div>
      </div>

      <!-- Device info notice -->
      <div class="bg-white/5 rounded-lg p-3 mb-4">
        <p class="text-xs text-slate-400">
          <i class="fas fa-info-circle mr-1"></i>
          ${escapeHTML(t('deviceInfoNotice') || 'Les informations techniques (navigateur, appareil) seront incluses pour nous aider a resoudre les problemes.')}
        </p>
      </div>

      <!-- Submit button -->
      <button
        onclick="submitFeedbackForm()"
        class="btn w-full bg-primary-500 hover:bg-primary-600 text-white"
        id="submit-feedback-btn"
      >
        <i class="fas fa-paper-plane mr-2"></i>
        ${escapeHTML(t('submitFeedback') || 'Envoyer le feedback')}
      </button>
    </div>
  `;
}

/**
 * Render feedback button HTML (floating button)
 * @param {Object} options - Button options (position, size)
 * @returns {string} HTML string
 */
export function renderFeedbackButton(options = {}) {
  const position = options.position || 'bottom-right';
  const size = options.size || 'md';

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  return `
    <button
      onclick="openFeedbackModal()"
      class="feedback-floating-btn fixed ${positionClasses[position] || positionClasses['bottom-right']} ${sizeClasses[size] || sizeClasses['md']} bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center"
      aria-label="${escapeHTML(t('sendFeedback') || 'Envoyer un feedback')}"
      title="${escapeHTML(t('sendFeedback') || 'Envoyer un feedback')}"
    >
      <i class="fas fa-comment-dots"></i>
    </button>
  `;
}

/**
 * Render feedback card HTML
 * @param {Object} feedback - Feedback object
 * @returns {string} HTML string
 */
export function renderFeedbackCard(feedback) {
  if (!feedback) return '';

  const typeInfo = getFeedbackTypeById(feedback.type);
  const state = getState();
  const isOwner = feedback.userId === (state.user?.uid || 'anonymous');

  return `
    <div
      class="feedback-card p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-feedback-id="${escapeHTML(feedback.id)}"
      role="article"
      aria-label="${escapeHTML(typeInfo?.label || feedback.type)} feedback"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${typeInfo?.emoji || '💬'}</span>
          <div>
            <div class="flex items-center gap-2">
              <span class="${typeInfo?.color || 'text-white'} font-medium">
                ${escapeHTML(typeInfo?.label || feedback.type)}
              </span>
              <span class="px-2 py-0.5 rounded-full text-xs ${getStatusColor(feedback.status)}">
                ${escapeHTML(getStatusLabel(feedback.status))}
              </span>
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              ${escapeHTML(formatDate(feedback.createdAt))}
            </div>
          </div>
        </div>
        ${isOwner ? `
          <button
            onclick="deleteFeedbackItem('${escapeHTML(feedback.id)}')"
            class="text-slate-400 hover:text-red-400 transition-colors"
            aria-label="${escapeHTML(t('delete') || 'Supprimer')}"
          >
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>

      <!-- Message -->
      <p class="text-white text-sm mb-3">${escapeHTML(feedback.message)}</p>

      <!-- Screenshot thumbnail -->
      ${feedback.screenshot ? `
        <div class="mb-3">
          <img
            src="${escapeHTML(feedback.screenshot)}"
            alt="${escapeHTML(t('screenshotAttachment') || 'Capture d\'ecran jointe')}"
            class="max-w-[200px] rounded-lg border border-white/10 cursor-pointer hover:opacity-80"
            onclick="viewFeedbackScreenshot('${escapeHTML(feedback.id)}')"
            loading="lazy"
          >
        </div>
      ` : ''}

      <!-- Footer info -->
      <div class="flex items-center gap-4 text-xs text-slate-500">
        <span>
          <i class="fas fa-mobile-alt mr-1"></i>
          ${escapeHTML(feedback.deviceInfo?.deviceType || 'unknown')}
        </span>
        <span>
          <i class="fas fa-globe mr-1"></i>
          ${escapeHTML(feedback.deviceInfo?.browser || 'unknown')}
        </span>
        <span>
          <i class="fas fa-code-branch mr-1"></i>
          v${escapeHTML(feedback.appVersion || 'unknown')}
        </span>
      </div>
    </div>
  `;
}

/**
 * Render feedback history list HTML
 * @param {Object} options - Filter/display options
 * @returns {string} HTML string
 */
export function renderFeedbackHistory(options = {}) {
  const feedbackList = getFeedbackHistory(options);
  const stats = getFeedbackStats();

  if (feedbackList.length === 0) {
    return `
      <div class="feedback-history">
        <div class="empty-state p-8 text-center" role="status" aria-live="polite">
          <div class="text-6xl mb-4">💬</div>
          <h3 class="text-lg font-semibold text-white mb-2">
            ${escapeHTML(t('noFeedback') || 'Aucun feedback')}
          </h3>
          <p class="text-slate-400 text-sm mb-4">
            ${escapeHTML(t('noFeedbackDesc') || 'Tu n\'as pas encore envoye de feedback')}
          </p>
          <button
            onclick="openFeedbackModal()"
            class="btn bg-primary-500 hover:bg-primary-600 text-white"
          >
            <i class="fas fa-comment-dots mr-2"></i>
            ${escapeHTML(t('sendFirstFeedback') || 'Envoyer mon premier feedback')}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="feedback-history">
      <!-- Stats summary -->
      <div class="feedback-stats bg-white/5 rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-white font-medium">
            <i class="fas fa-chart-bar mr-2 text-primary-400"></i>
            ${escapeHTML(t('feedbackStats') || 'Statistiques')}
          </h4>
          <span class="text-slate-400 text-sm">${stats.total} feedback${stats.total > 1 ? 's' : ''}</span>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center">
          ${Object.entries(FeedbackTypes).map(([key, type]) => `
            <div class="p-2 rounded-lg ${type.bgColor}">
              <div class="text-lg">${type.emoji}</div>
              <div class="${type.color} text-sm font-medium">${stats.byType[key] || 0}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Feedback list -->
      <div class="feedback-list space-y-3" role="list" aria-label="${escapeHTML(t('feedbackHistory') || 'Historique des feedbacks')}">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-white font-medium">
            <i class="fas fa-history mr-2 text-slate-400"></i>
            ${escapeHTML(t('myFeedback') || 'Mes feedbacks')}
          </h4>
        </div>
        ${feedbackList.map(feedback => renderFeedbackCard(feedback)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render feedback modal HTML
 * @param {Object} options - Modal options
 * @returns {string} HTML string
 */
export function renderFeedbackModal(options = {}) {
  return `
    <div
      class="feedback-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeFeedbackModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div class="bg-gray-900 w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-500 to-purple-500 p-4 flex-shrink-0">
          <div class="flex justify-between items-center">
            <h2 id="feedback-modal-title" class="text-lg font-bold text-white">
              <i class="fas fa-comment-dots mr-2"></i>
              ${escapeHTML(t('feedback') || 'Feedback')}
            </h2>
            <button
              onclick="closeFeedbackModal()"
              class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
              aria-label="${escapeHTML(t('close') || 'Fermer')}"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 overflow-y-auto flex-1">
          ${renderFeedbackForm(options)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Get feedback filtered by type
 * @param {string} type - Feedback type to filter by
 * @returns {Array} Array of feedback objects matching the type
 */
export function getFeedbackByType(type) {
  if (!type || !isValidFeedbackType(type)) {
    return [];
  }

  const feedbackList = getFeedbackFromStorage();
  return feedbackList.filter(f => f.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Export all user feedback as JSON
 * @returns {Object} Export object with metadata and feedback data
 */
export function exportFeedback() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const feedbackList = getFeedbackFromStorage();
  const userFeedback = feedbackList.filter(f => f.userId === userId);
  const stats = getFeedbackStats();

  return {
    exportedAt: new Date().toISOString(),
    userId,
    username: state.username || 'Anonyme',
    appVersion: getAppVersion(),
    totalFeedback: userFeedback.length,
    stats,
    feedback: userFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

/**
 * Check if user can submit feedback (rate limiting: max 5 per day)
 * @returns {Object} Object with canSubmit boolean and remaining count
 */
export function canSubmitFeedback() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const feedbackList = getFeedbackFromStorage();

  // Count feedback submitted in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentFeedback = feedbackList.filter(f =>
    f.userId === userId && new Date(f.createdAt) > oneDayAgo
  );

  const remaining = MAX_FEEDBACK_PER_DAY - recentFeedback.length;
  const canSubmit = remaining > 0;

  return {
    canSubmit,
    remaining: Math.max(0, remaining),
    limit: MAX_FEEDBACK_PER_DAY,
    submittedToday: recentFeedback.length,
  };
}

/**
 * Render a list of feedback items with i18n support
 * @param {Array} feedbacks - Array of feedback objects to render
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} HTML string
 */
export function renderFeedbackList(feedbacks, lang = 'fr') {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    const emptyLabels = {
      fr: 'Aucun feedback a afficher',
      en: 'No feedback to display',
      es: 'No hay feedback para mostrar',
      de: 'Kein Feedback anzuzeigen',
    };

    return `
      <div class="feedback-list-empty text-center p-6" role="status">
        <div class="text-4xl mb-3">💬</div>
        <p class="text-slate-400 text-sm">${escapeHTML(emptyLabels[lang] || emptyLabels.fr)}</p>
      </div>
    `;
  }

  const titleLabels = {
    fr: 'Liste des feedbacks',
    en: 'Feedback list',
    es: 'Lista de feedback',
    de: 'Feedback-Liste',
  };

  const countLabels = {
    fr: 'feedback',
    en: 'feedback',
    es: 'feedback',
    de: 'Feedback',
  };

  return `
    <div class="feedback-list" role="list" aria-label="${escapeHTML(titleLabels[lang] || titleLabels.fr)}">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-white font-medium text-sm">
          ${escapeHTML(titleLabels[lang] || titleLabels.fr)}
        </h4>
        <span class="text-xs text-slate-400">${feedbacks.length} ${escapeHTML(countLabels[lang] || countLabels.fr)}${feedbacks.length > 1 ? 's' : ''}</span>
      </div>
      <div class="space-y-3">
        ${feedbacks.map(feedback => renderFeedbackCard(feedback)).join('')}
      </div>
    </div>
  `;
}

/**
 * Clear all feedback (for testing)
 * @returns {Object} Result with success status
 */
export function clearAllFeedback() {
  saveFeedbackToStorage([]);
  showToast(t('allFeedbackCleared') || 'Tous les feedbacks ont ete supprimes', 'success');
  return { success: true };
}

// Global window state for form
if (typeof window !== 'undefined') {
  window.feedbackFormState = {
    selectedType: '',
    screenshot: null,
  };
}

// Global handlers for onclick events
if (typeof window !== 'undefined') {
  window.selectFeedbackType = (type) => {
    window.feedbackFormState.selectedType = type;
    const input = document.getElementById('feedback-type-input');
    if (input) input.value = type;

    // Update button styles
    const buttons = document.querySelectorAll('.feedback-type-btn');
    buttons.forEach(btn => {
      const btnType = btn.dataset.type;
      const typeInfo = FeedbackTypes[btnType];
      if (btnType === type) {
        btn.classList.remove('border-white/10');
        btn.classList.add('border-primary-500', typeInfo?.bgColor || 'bg-white/10');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('border-primary-500', typeInfo?.bgColor || 'bg-white/10');
        btn.classList.add('border-white/10');
        btn.setAttribute('aria-checked', 'false');
      }
    });
  };

  window.updateFeedbackCharsCount = () => {
    const textarea = document.getElementById('feedback-message');
    const counter = document.getElementById('feedback-chars-count');
    if (textarea && counter) {
      counter.textContent = textarea.value.length;
    }
  };

  window.submitFeedbackForm = () => {
    const typeInput = document.getElementById('feedback-type-input');
    const messageInput = document.getElementById('feedback-message');
    const screenshotCheckbox = document.getElementById('feedback-include-screenshot');

    const type = typeInput?.value || window.feedbackFormState.selectedType;
    const message = messageInput?.value || '';

    if (!type) {
      showToast(t('selectFeedbackType') || 'Selectionne un type de feedback', 'warning');
      return;
    }

    const metadata = {
      page: getState().activeTab,
    };

    if (screenshotCheckbox?.checked && window.feedbackFormState.screenshot) {
      metadata.screenshot = window.feedbackFormState.screenshot;
    }

    const result = submitFeedback(type, message, metadata);

    if (result.success) {
      // Reset form
      if (messageInput) messageInput.value = '';
      if (typeInput) typeInput.value = '';
      window.feedbackFormState = { selectedType: '', screenshot: null };

      // Close modal if open
      window.closeFeedbackModal?.();
    }
  };

  window.openFeedbackModal = () => {
    setState({ showFeedbackModal: true });
  };

  window.closeFeedbackModal = () => {
    setState({ showFeedbackModal: false });
  };

  window.deleteFeedbackItem = (feedbackId) => {
    const result = deleteFeedback(feedbackId);
    if (result.success) {
      // Refresh display
      setState({ refreshFeedback: Date.now() });
    }
  };

  window.removeFeedbackScreenshot = () => {
    window.feedbackFormState.screenshot = null;
    const preview = document.getElementById('feedback-screenshot-preview');
    const checkbox = document.getElementById('feedback-include-screenshot');
    if (preview) preview.classList.add('hidden');
    if (checkbox) checkbox.checked = false;
  };

  window.viewFeedbackScreenshot = (feedbackId) => {
    const feedback = getFeedbackById(feedbackId);
    if (feedback?.screenshot) {
      // Open in fullscreen or new tab
      window.open(feedback.screenshot, '_blank');
    }
  };
}

// Export default with all functions
export default {
  FeedbackType,
  FeedbackTypes,
  FeedbackStatus,
  submitFeedback,
  getFeedbackHistory,
  getFeedbackById,
  getFeedbackByType,
  getFeedbackStats,
  deleteFeedback,
  getFeedbackTypes,
  getFeedbackTypeById,
  isValidFeedbackType,
  getDeviceInfo,
  getAppVersion,
  renderFeedbackForm,
  renderFeedbackButton,
  renderFeedbackCard,
  renderFeedbackHistory,
  renderFeedbackList,
  renderFeedbackModal,
  exportFeedback,
  canSubmitFeedback,
  clearAllFeedback,
};
