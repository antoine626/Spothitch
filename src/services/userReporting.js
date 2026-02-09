/**
 * User Reporting Service
 * Feature #194 - Service pour signaler un utilisateur
 *
 * Gestion des signalements d'utilisateurs avec stockage local
 * et synchronisation Firebase quand connecte.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key for reports
const USER_REPORTS_KEY = 'spothitch_user_reports';

// 24 hours in milliseconds (window for cancellation)
const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Report status enum
 */
export const ReportStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  ACTION_TAKEN: 'action_taken',
  DISMISSED: 'dismissed',
};

/**
 * Report reasons enum
 */
export const ReportReasons = {
  HARASSMENT: {
    id: 'harassment',
    label: 'Harcelement',
    icon: 'fa-user-slash',
    description: 'Comportement harcelant ou intimidant',
  },
  SPAM: {
    id: 'spam',
    label: 'Spam',
    icon: 'fa-ad',
    description: 'Messages non sollicites ou publicitaires',
  },
  FAKE_PROFILE: {
    id: 'fake_profile',
    label: 'Faux profil',
    icon: 'fa-user-secret',
    description: 'Profil frauduleux ou usurpation d\'identite',
  },
  DANGEROUS_BEHAVIOR: {
    id: 'dangerous_behavior',
    label: 'Comportement dangereux',
    icon: 'fa-exclamation-triangle',
    description: 'Actions mettant en danger la securite des autres',
  },
  INAPPROPRIATE_CONTENT: {
    id: 'inappropriate_content',
    label: 'Contenu inapproprie',
    icon: 'fa-ban',
    description: 'Photos, messages ou contenu offensant',
  },
  SCAM: {
    id: 'scam',
    label: 'Arnaque',
    icon: 'fa-hand-holding-usd',
    description: 'Tentative de fraude ou d\'escroquerie',
  },
  OTHER: {
    id: 'other',
    label: 'Autre',
    icon: 'fa-question-circle',
    description: 'Autre raison non listee',
  },
};

/**
 * Get reports from storage
 * @returns {Array} Array of report objects
 */
function getReportsFromStorage() {
  try {
    const data = Storage.get(USER_REPORTS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading user reports:', error);
    return [];
  }
}

/**
 * Save reports to storage
 * @param {Array} reports - Array of report objects
 */
function saveReportsToStorage(reports) {
  try {
    Storage.set(USER_REPORTS_KEY, reports);
    setState({ userReports: reports });
  } catch (error) {
    console.error('Error saving user reports:', error);
  }
}

/**
 * Generate unique report ID
 * @returns {string} Unique report ID
 */
function generateReportId() {
  return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all available report reasons
 * @returns {Array} Array of reason objects
 */
export function getReportReasons() {
  return Object.values(ReportReasons);
}

/**
 * Get a specific report reason by ID
 * @param {string} reasonId - The reason ID
 * @returns {Object|null} Reason object or null if not found
 */
export function getReportReasonById(reasonId) {
  if (!reasonId) return null;
  return Object.values(ReportReasons).find(r => r.id === reasonId) || null;
}

/**
 * Report a user
 * @param {string} userId - ID of the user to report
 * @param {string} reason - Reason ID for reporting
 * @param {string} details - Additional details about the report
 * @returns {Object} Result object with success status and report data
 */
export function reportUser(userId, reason, details = '') {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  if (!reason) {
    return { success: false, error: 'reason_required' };
  }

  // Validate reason
  const validReason = getReportReasonById(reason);
  if (!validReason) {
    return { success: false, error: 'invalid_reason' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  // Cannot report yourself
  if (currentUserId && userId === currentUserId) {
    showToast(t('cannotReportSelf') || 'Tu ne peux pas te signaler toi-meme', 'warning');
    return { success: false, error: 'cannot_report_self' };
  }

  const reports = getReportsFromStorage();

  // Check if already reported (only active reports - not dismissed)
  const existingReport = reports.find(
    r => r.reportedUserId === userId &&
      r.reporterId === (currentUserId || 'anonymous') &&
      r.status !== ReportStatus.DISMISSED
  );

  if (existingReport) {
    showToast(t('userAlreadyReported') || 'Tu as deja signale cet utilisateur', 'warning');
    return { success: false, error: 'already_reported' };
  }

  // Create report entry
  const report = {
    id: generateReportId(),
    reportedUserId: userId,
    reporterId: currentUserId || 'anonymous',
    reason: reason,
    details: details.trim(),
    status: ReportStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to reports list
  reports.push(report);
  saveReportsToStorage(reports);

  showToast(t('reportSubmitted') || 'Signalement envoye, merci !', 'success');

  return { success: true, report };
}

/**
 * Check if current user has already reported a specific user
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if already reported
 */
export function hasReportedUser(userId) {
  if (!userId) return false;

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';
  const reports = getReportsFromStorage();

  return reports.some(
    r => r.reportedUserId === userId &&
      r.reporterId === currentUserId &&
      r.status !== ReportStatus.DISMISSED
  );
}

/**
 * Get all reports made by the current user
 * @returns {Array} Array of report objects
 */
export function getMyReports() {
  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';
  const reports = getReportsFromStorage();

  return reports
    .filter(r => r.reporterId === currentUserId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a specific report by ID
 * @param {string} reportId - ID of the report
 * @returns {Object|null} Report object or null if not found
 */
export function getReportById(reportId) {
  if (!reportId) return null;

  const reports = getReportsFromStorage();
  return reports.find(r => r.id === reportId) || null;
}

/**
 * Cancel a report (only allowed within 24 hours of creation)
 * @param {string} reportId - ID of the report to cancel
 * @returns {Object} Result object with success status
 */
export function cancelReport(reportId) {
  if (!reportId) {
    return { success: false, error: 'invalid_report_id' };
  }

  const reports = getReportsFromStorage();
  const reportIndex = reports.findIndex(r => r.id === reportId);

  if (reportIndex === -1) {
    showToast(t('reportNotFound') || 'Signalement introuvable', 'error');
    return { success: false, error: 'report_not_found' };
  }

  const report = reports[reportIndex];
  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  // Check if current user is the reporter
  if (report.reporterId !== currentUserId) {
    showToast(t('cannotCancelOthersReport') || 'Tu ne peux pas annuler ce signalement', 'error');
    return { success: false, error: 'not_reporter' };
  }

  // Check if report can still be cancelled (within 24 hours)
  const createdAt = new Date(report.createdAt).getTime();
  const now = Date.now();
  const timeSinceCreation = now - createdAt;

  if (timeSinceCreation > CANCEL_WINDOW_MS) {
    showToast(t('cancelWindowExpired') || 'Le delai d\'annulation est depasse (24h)', 'warning');
    return { success: false, error: 'cancel_window_expired' };
  }

  // Check if report is still pending (can't cancel reviewed reports)
  if (report.status !== ReportStatus.PENDING) {
    showToast(t('cannotCancelProcessedReport') || 'Ce signalement a deja ete traite', 'warning');
    return { success: false, error: 'report_already_processed' };
  }

  // Remove the report
  reports.splice(reportIndex, 1);
  saveReportsToStorage(reports);

  showToast(t('reportCancelled') || 'Signalement annule', 'success');

  return { success: true };
}

/**
 * Check if a report can still be cancelled
 * @param {string} reportId - ID of the report
 * @returns {Object} Object with canCancel boolean and remainingTime in ms
 */
export function canCancelReport(reportId) {
  if (!reportId) return { canCancel: false, remainingTime: 0 };

  const report = getReportById(reportId);
  if (!report) return { canCancel: false, remainingTime: 0 };

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  // Must be the reporter
  if (report.reporterId !== currentUserId) {
    return { canCancel: false, remainingTime: 0 };
  }

  // Must be pending
  if (report.status !== ReportStatus.PENDING) {
    return { canCancel: false, remainingTime: 0 };
  }

  const createdAt = new Date(report.createdAt).getTime();
  const now = Date.now();
  const timeSinceCreation = now - createdAt;
  const remainingTime = Math.max(0, CANCEL_WINDOW_MS - timeSinceCreation);

  return {
    canCancel: remainingTime > 0,
    remainingTime: remainingTime,
  };
}

/**
 * Get report statistics for current user
 * @returns {Object} Statistics object
 */
export function getReportStats() {
  const myReports = getMyReports();

  const stats = {
    total: myReports.length,
    pending: myReports.filter(r => r.status === ReportStatus.PENDING).length,
    reviewed: myReports.filter(r => r.status === ReportStatus.REVIEWED).length,
    actionTaken: myReports.filter(r => r.status === ReportStatus.ACTION_TAKEN).length,
    dismissed: myReports.filter(r => r.status === ReportStatus.DISMISSED).length,
    byReason: {},
  };

  // Count by reason
  myReports.forEach(report => {
    const reason = report.reason || 'unknown';
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
  });

  return stats;
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
 * Format remaining time for display
 * @param {number} ms - Milliseconds remaining
 * @returns {string} Formatted time string
 */
function formatRemainingTime(ms) {
  if (ms <= 0) return '0h';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

/**
 * Get status label for display
 * @param {string} status - Report status
 * @returns {string} Status label
 */
function getStatusLabel(status) {
  const labels = {
    [ReportStatus.PENDING]: t('reportStatusPending') || 'En attente',
    [ReportStatus.REVIEWED]: t('reportStatusReviewed') || 'En cours d\'examen',
    [ReportStatus.ACTION_TAKEN]: t('reportStatusActionTaken') || 'Action prise',
    [ReportStatus.DISMISSED]: t('reportStatusDismissed') || 'Rejete',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 * @param {string} status - Report status
 * @returns {string} CSS color class
 */
function getStatusColor(status) {
  const colors = {
    [ReportStatus.PENDING]: 'text-yellow-400 bg-yellow-500/20',
    [ReportStatus.REVIEWED]: 'text-blue-400 bg-blue-500/20',
    [ReportStatus.ACTION_TAKEN]: 'text-green-400 bg-green-500/20',
    [ReportStatus.DISMISSED]: 'text-slate-400 bg-slate-500/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Render the report button HTML
 * @param {string} userId - ID of the user to report
 * @param {string} username - Display name of the user
 * @returns {string} HTML string of report button
 */
export function renderReportButton(userId, username = '') {
  if (!userId) return '';

  const state = getState();
  const currentUserId = state.user?.uid;

  // Don't show report button for self
  if (currentUserId && userId === currentUserId) {
    return '';
  }

  const displayName = username || userId;
  const hasReported = hasReportedUser(userId);

  if (hasReported) {
    return `
      <button
        class="btn btn-sm bg-slate-500/20 text-slate-400 cursor-not-allowed"
        disabled
        aria-label="${escapeHTML(t('alreadyReported') || 'Deja signale')}"
        data-user-id="${escapeHTML(userId)}"
        data-action="reported"
      >
        <i class="fas fa-flag mr-1"></i>
        ${escapeHTML(t('reported') || 'Signale')}
      </button>
    `;
  }

  return `
    <button
      onclick="openReportModal('${escapeHTML(userId)}', '${escapeHTML(displayName)}')"
      class="btn btn-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
      aria-label="${escapeHTML(t('reportUser') || 'Signaler')} ${escapeHTML(displayName)}"
      data-user-id="${escapeHTML(userId)}"
      data-action="report"
    >
      <i class="fas fa-flag mr-1"></i>
      ${escapeHTML(t('reportUser') || 'Signaler')}
    </button>
  `;
}

/**
 * Render the report modal HTML
 * @param {string} userId - ID of the user to report
 * @param {string} username - Display name of the user
 * @returns {string} HTML string of report modal
 */
export function renderReportModal(userId, username = '') {
  if (!userId) return '';

  const displayName = username || userId;
  const reasons = getReportReasons();

  return `
    <div
      class="report-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeReportModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 to-red-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="report-modal-title" class="text-xl font-bold text-white">
                <i class="fas fa-flag mr-2"></i>
                ${escapeHTML(t('reportUserTitle') || 'Signaler un utilisateur')}
              </h2>
              <p class="text-white/80 text-sm mt-1">${escapeHTML(displayName)}</p>
            </div>
            <button
              onclick="closeReportModal()"
              class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
              aria-label="${escapeHTML(t('close') || 'Fermer')}"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-slate-300 mb-4">
            ${escapeHTML(t('reportDescription') || 'Pourquoi signales-tu cet utilisateur ? Ton signalement sera examine par notre equipe.')}
          </p>

          <!-- Reason selection -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2" for="report-reason-select">
              ${escapeHTML(t('reportReason') || 'Raison du signalement')} *
            </label>
            <select
              id="report-reason-select"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">${escapeHTML(t('selectReportReason') || 'Selectionne une raison...')}</option>
              ${reasons.map(r => `
                <option value="${escapeHTML(r.id)}">${escapeHTML(r.label)}</option>
              `).join('')}
            </select>
          </div>

          <!-- Details textarea -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2" for="report-details">
              ${escapeHTML(t('reportDetails') || 'Details supplementaires (optionnel)')}
            </label>
            <textarea
              id="report-details"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="3"
              maxlength="500"
              placeholder="${escapeHTML(t('reportDetailsPlaceholder') || 'Decris la situation en detail...')}"
            ></textarea>
            <p class="text-xs text-slate-500 mt-1">
              <span id="report-chars-count">0</span>/500 ${escapeHTML(t('characters') || 'caracteres')}
            </p>
          </div>

          <!-- Warning -->
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <p class="text-yellow-400 text-sm">
              <i class="fas fa-info-circle mr-2"></i>
              ${escapeHTML(t('reportWarning') || 'Les faux signalements peuvent entrainer des sanctions sur ton compte.')}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-gray-800 flex gap-3">
          <button
            onclick="closeReportModal()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="submitReport('${escapeHTML(userId)}')"
            class="btn flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            id="submit-report-btn"
          >
            <i class="fas fa-flag mr-2"></i>
            ${escapeHTML(t('submitReport') || 'Envoyer le signalement')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the my reports list HTML
 * @returns {string} HTML string of reports list
 */
export function renderMyReportsList() {
  const reports = getMyReports();

  if (reports.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noReports') || 'Aucun signalement')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noReportsDesc') || 'Tu n\'as fait aucun signalement pour le moment')}</p>
      </div>
    `;
  }

  const listItems = reports.map(report => {
    const reason = getReportReasonById(report.reason);
    const cancelInfo = canCancelReport(report.id);

    return `
      <div
        class="report-item p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
        data-report-id="${escapeHTML(report.id)}"
        role="listitem"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}">
                ${escapeHTML(getStatusLabel(report.status))}
              </span>
              <span class="text-slate-500 text-xs">${escapeHTML(formatDate(report.createdAt))}</span>
            </div>
            <div class="flex items-center gap-2 text-white mb-1">
              <i class="fas ${escapeHTML(reason?.icon || 'fa-flag')} text-orange-400"></i>
              <span class="font-medium">${escapeHTML(reason?.label || report.reason)}</span>
            </div>
            <p class="text-sm text-slate-400">
              ${escapeHTML(t('reportedUser') || 'Utilisateur signale')}: <span class="text-white">${escapeHTML(report.reportedUserId)}</span>
            </p>
            ${report.details ? `
              <p class="text-sm text-slate-500 mt-2 italic">"${escapeHTML(report.details)}"</p>
            ` : ''}
          </div>
          ${cancelInfo.canCancel ? `
            <div class="flex flex-col items-end gap-2">
              <button
                onclick="cancelUserReport('${escapeHTML(report.id)}')"
                class="btn btn-sm bg-red-500/20 hover:bg-red-500/30 text-red-400"
                aria-label="${escapeHTML(t('cancelReport') || 'Annuler le signalement')}"
              >
                <i class="fas fa-times mr-1"></i>
                ${escapeHTML(t('cancel') || 'Annuler')}
              </button>
              <span class="text-xs text-slate-500">
                ${escapeHTML(formatRemainingTime(cancelInfo.remainingTime))} ${escapeHTML(t('remaining') || 'restant')}
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="reports-list space-y-3" role="list" aria-label="${escapeHTML(t('myReports') || 'Mes signalements')}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">
          <i class="fas fa-flag mr-2 text-orange-400"></i>
          ${escapeHTML(t('myReports') || 'Mes signalements')}
          <span class="text-sm font-normal text-slate-400 ml-2">(${reports.length})</span>
        </h3>
      </div>
      ${listItems}
    </div>
  `;
}

/**
 * Clear all reports (for testing or reset)
 * @returns {Object} Result object with success status
 */
export function clearAllReports() {
  saveReportsToStorage([]);
  showToast(t('allReportsCleared') || 'Tous les signalements ont ete supprimes', 'success');
  return { success: true };
}

// Global handlers for onclick events
window.openReportModal = (userId, username) => {
  setState({
    showReportModal: true,
    reportTargetId: userId,
    reportTargetName: username,
  });
};

window.closeReportModal = () => {
  setState({
    showReportModal: false,
    reportTargetId: null,
    reportTargetName: null,
  });
};

window.submitReport = (userId) => {
  const reasonSelect = document.getElementById('report-reason-select');
  const detailsTextarea = document.getElementById('report-details');

  const reason = reasonSelect?.value || null;
  const details = detailsTextarea?.value || '';

  if (!reason) {
    showToast(t('selectReportReason') || 'Selectionne une raison', 'warning');
    return;
  }

  const result = reportUser(userId, reason, details);
  if (result.success) {
    window.closeReportModal();
  }
};

window.cancelUserReport = (reportId) => {
  cancelReport(reportId);
};

window.updateReportCharsCount = () => {
  const textarea = document.getElementById('report-details');
  const counter = document.getElementById('report-chars-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
};

// Export default with all functions
export default {
  ReportStatus,
  ReportReasons,
  reportUser,
  getReportReasons,
  getReportReasonById,
  hasReportedUser,
  getMyReports,
  getReportById,
  cancelReport,
  canCancelReport,
  getReportStats,
  renderReportButton,
  renderReportModal,
  renderMyReportsList,
  clearAllReports,
};
