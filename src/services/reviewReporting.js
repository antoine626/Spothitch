/**
 * Review Reporting Service
 * Feature #81 - Signaler un avis
 *
 * Gestion des signalements d'avis avec file de moderation dediee.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { getReviewById, ReviewStatus } from './detailedReviews.js';

// Storage key for review reports
const REVIEW_REPORTS_KEY = 'spothitch_review_reports';

// 24 hours in milliseconds (window for cancellation)
const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Report status enum
 */
export const ReportStatus = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  ACTION_TAKEN: 'action_taken',
  DISMISSED: 'dismissed',
};

/**
 * Report reasons enum
 */
export const ReportReasons = {
  FAKE: {
    id: 'fake',
    label: 'Faux avis',
    icon: 'fa-user-secret',
    description: 'L\'avis semble faux ou frauduleux',
    severity: 'high',
  },
  OFFENSIVE: {
    id: 'offensive',
    label: 'Contenu offensant',
    icon: 'fa-ban',
    description: 'Langage inapproprie, insultes ou discriminations',
    severity: 'high',
  },
  SPAM: {
    id: 'spam',
    label: 'Spam / Publicite',
    icon: 'fa-ad',
    description: 'Contenu promotionnel ou publicitaire',
    severity: 'medium',
  },
  MISLEADING: {
    id: 'misleading',
    label: 'Information trompeuse',
    icon: 'fa-exclamation-triangle',
    description: 'Informations fausses ou trompeuses sur le spot',
    severity: 'medium',
  },
  OUTDATED: {
    id: 'outdated',
    label: 'Information obsolete',
    icon: 'fa-clock',
    description: 'L\'avis ne reflete plus la realite du spot',
    severity: 'low',
  },
  IRRELEVANT: {
    id: 'irrelevant',
    label: 'Hors sujet',
    icon: 'fa-question-circle',
    description: 'L\'avis n\'est pas pertinent pour ce spot',
    severity: 'low',
  },
  OTHER: {
    id: 'other',
    label: 'Autre',
    icon: 'fa-flag',
    description: 'Autre raison non listee',
    severity: 'low',
  },
};

/**
 * Get reports from storage
 * @returns {Array} Array of report objects
 */
function getReportsFromStorage() {
  try {
    const data = Storage.get(REVIEW_REPORTS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[ReviewReporting] Error reading reports:', error);
    return [];
  }
}

/**
 * Save reports to storage
 * @param {Array} reports - Array of report objects
 */
function saveReportsToStorage(reports) {
  try {
    Storage.set(REVIEW_REPORTS_KEY, reports);
    setState({ reviewReports: reports });
  } catch (error) {
    console.error('[ReviewReporting] Error saving reports:', error);
  }
}

/**
 * Generate unique report ID
 * @returns {string} Unique report ID
 */
function generateReportId() {
  return `rreport_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Report a review
 * @param {string} reviewId - ID of the review to report
 * @param {string} reason - Reason ID for reporting
 * @param {string} details - Additional details about the report
 * @returns {Object} Result object with success status and report data
 */
export function reportReview(reviewId, reason, details = '') {
  if (!reviewId) {
    return { success: false, error: 'review_id_required' };
  }

  if (!reason) {
    return { success: false, error: 'reason_required' };
  }

  // Validate reason
  const validReason = getReportReasonById(reason);
  if (!validReason) {
    return { success: false, error: 'invalid_reason' };
  }

  // Verify review exists
  const review = getReviewById(reviewId);
  if (!review) {
    return { success: false, error: 'review_not_found' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  // Cannot report own review
  if (currentUserId && review.userId === currentUserId) {
    showToast(t('cannotReportOwnReview') || 'Tu ne peux pas signaler ton propre avis', 'warning');
    return { success: false, error: 'cannot_report_own_review' };
  }

  const reports = getReportsFromStorage();

  // Check if already reported by this user (only active reports)
  const existingReport = reports.find(
    r => r.reviewId === reviewId &&
      r.reporterId === (currentUserId || 'anonymous') &&
      r.status !== ReportStatus.DISMISSED
  );

  if (existingReport) {
    showToast(t('reviewAlreadyReported') || 'Tu as deja signale cet avis', 'warning');
    return { success: false, error: 'already_reported' };
  }

  // Create report entry
  const report = {
    id: generateReportId(),
    reviewId,
    spotId: review.spotId,
    reviewAuthorId: review.userId,
    reporterId: currentUserId || 'anonymous',
    reason,
    severity: validReason.severity,
    details: details.trim(),
    status: ReportStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to reports list
  reports.push(report);
  saveReportsToStorage(reports);

  showToast(t('reviewReportSubmitted') || 'Signalement envoye. Merci pour ta vigilance !', 'success');

  return { success: true, report };
}

/**
 * Check if current user has already reported a specific review
 * @param {string} reviewId - ID of the review to check
 * @returns {boolean} True if already reported
 */
export function hasReportedReview(reviewId) {
  if (!reviewId) return false;

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';
  const reports = getReportsFromStorage();

  return reports.some(
    r => r.reviewId === reviewId &&
      r.reporterId === currentUserId &&
      r.status !== ReportStatus.DISMISSED
  );
}

/**
 * Get all reports made by the current user
 * @returns {Array} Array of report objects
 */
export function getMyReviewReports() {
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
export function cancelReviewReport(reportId) {
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

  // Check if report is still pending
  if (report.status !== ReportStatus.PENDING) {
    showToast(t('cannotCancelProcessedReport') || 'Ce signalement est deja en cours de traitement', 'warning');
    return { success: false, error: 'report_already_processed' };
  }

  // Remove the report
  reports.splice(reportIndex, 1);
  saveReportsToStorage(reports);

  showToast(t('reviewReportCancelled') || 'Signalement annule', 'success');

  return { success: true };
}

/**
 * Check if a report can still be cancelled
 * @param {string} reportId - ID of the report
 * @returns {Object} Object with canCancel boolean and remainingTime in ms
 */
export function canCancelReviewReport(reportId) {
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
    remainingTime,
  };
}

/**
 * Get moderation queue (all pending reports)
 * @returns {Array} Array of pending report objects sorted by severity and date
 */
export function getModerationQueue() {
  const reports = getReportsFromStorage();

  // Severity order: high > medium > low
  const severityOrder = { high: 0, medium: 1, low: 2 };

  return reports
    .filter(r => r.status === ReportStatus.PENDING || r.status === ReportStatus.UNDER_REVIEW)
    .sort((a, b) => {
      // First sort by severity
      const sevDiff = (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
      if (sevDiff !== 0) return sevDiff;
      // Then by date (oldest first)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

/**
 * Get reports for a specific review
 * @param {string} reviewId - ID of the review
 * @returns {Array} Array of report objects
 */
export function getReviewReportsByReviewId(reviewId) {
  if (!reviewId) return [];

  const reports = getReportsFromStorage();
  return reports.filter(r => r.reviewId === reviewId);
}

/**
 * Get report count for a review (active reports)
 * @param {string} reviewId - ID of the review
 * @returns {number} Number of active reports
 */
export function getReviewReportCount(reviewId) {
  if (!reviewId) return 0;

  const reports = getReviewReportsByReviewId(reviewId);
  return reports.filter(r => r.status !== ReportStatus.DISMISSED).length;
}

/**
 * Get report statistics
 * @returns {Object} Statistics object
 */
export function getReportStats() {
  const reports = getReportsFromStorage();

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
    underReview: reports.filter(r => r.status === ReportStatus.UNDER_REVIEW).length,
    actionTaken: reports.filter(r => r.status === ReportStatus.ACTION_TAKEN).length,
    dismissed: reports.filter(r => r.status === ReportStatus.DISMISSED).length,
    bySeverity: {
      high: reports.filter(r => r.severity === 'high').length,
      medium: reports.filter(r => r.severity === 'medium').length,
      low: reports.filter(r => r.severity === 'low').length,
    },
    byReason: {},
  };

  // Count by reason
  reports.forEach(report => {
    const reason = report.reason || 'unknown';
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
  });

  return stats;
}

/**
 * Update report status (for moderation)
 * @param {string} reportId - ID of the report
 * @param {string} newStatus - New status
 * @param {string} moderatorNote - Optional moderator note
 * @returns {Object} Result object with success status
 */
export function updateReportStatus(reportId, newStatus, moderatorNote = '') {
  if (!reportId) {
    return { success: false, error: 'report_id_required' };
  }

  if (!Object.values(ReportStatus).includes(newStatus)) {
    return { success: false, error: 'invalid_status' };
  }

  const reports = getReportsFromStorage();
  const reportIndex = reports.findIndex(r => r.id === reportId);

  if (reportIndex === -1) {
    return { success: false, error: 'report_not_found' };
  }

  const report = reports[reportIndex];
  report.status = newStatus;
  report.moderatorNote = moderatorNote.trim();
  report.updatedAt = new Date().toISOString();

  reports[reportIndex] = report;
  saveReportsToStorage(reports);

  return { success: true, report };
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
    [ReportStatus.UNDER_REVIEW]: t('reportStatusUnderReview') || 'En cours d\'examen',
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
    [ReportStatus.UNDER_REVIEW]: 'text-blue-400 bg-blue-500/20',
    [ReportStatus.ACTION_TAKEN]: 'text-green-400 bg-green-500/20',
    [ReportStatus.DISMISSED]: 'text-slate-400 bg-slate-500/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Get severity color class
 * @param {string} severity - Report severity
 * @returns {string} CSS color class
 */
function getSeverityColor(severity) {
  const colors = {
    high: 'text-red-400 bg-red-500/20',
    medium: 'text-orange-400 bg-orange-500/20',
    low: 'text-yellow-400 bg-yellow-500/20',
  };
  return colors[severity] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Render the report button HTML
 * @param {string} reviewId - ID of the review to report
 * @returns {string} HTML string of report button
 */
export function renderReportButton(reviewId) {
  if (!reviewId) return '';

  const hasReported = hasReportedReview(reviewId);

  if (hasReported) {
    return `
      <button
        class="btn btn-sm bg-slate-500/20 text-slate-400 cursor-not-allowed"
        disabled
        aria-label="${escapeHTML(t('alreadyReported') || 'Deja signale')}"
      >
        <i class="fas fa-flag mr-1"></i>
        ${escapeHTML(t('reported') || 'Signale')}
      </button>
    `;
  }

  return `
    <button
      onclick="openReviewReportModal('${escapeHTML(reviewId)}')"
      class="btn btn-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
      aria-label="${escapeHTML(t('reportReview') || 'Signaler cet avis')}"
    >
      <i class="fas fa-flag mr-1"></i>
      ${escapeHTML(t('report') || 'Signaler')}
    </button>
  `;
}

/**
 * Render the report modal HTML
 * @param {string} reviewId - ID of the review to report
 * @returns {string} HTML string of report modal
 */
export function renderReportModal(reviewId) {
  if (!reviewId) return '';

  const review = getReviewById(reviewId);
  const reasons = getReportReasons();

  return `
    <div
      class="review-report-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeReviewReportModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-report-modal-title"
    >
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 to-red-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="review-report-modal-title" class="text-xl font-bold text-white">
                <i class="fas fa-flag mr-2"></i>
                ${escapeHTML(t('reportReviewTitle') || 'Signaler un avis')}
              </h2>
              ${review ? `
                <p class="text-white/80 text-sm mt-1">
                  ${escapeHTML(t('reviewBy') || 'Avis de')} ${escapeHTML(review.username)}
                </p>
              ` : ''}
            </div>
            <button
              onclick="closeReviewReportModal()"
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
            ${escapeHTML(t('reportReviewDescription') || 'Pourquoi signales-tu cet avis ? Ton signalement sera examine par notre equipe de moderation.')}
          </p>

          <!-- Reason selection -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2" for="review-report-reason">
              ${escapeHTML(t('reportReason') || 'Raison du signalement')} *
            </label>
            <div class="space-y-2">
              ${reasons.map(r => `
                <label class="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="review-report-reason"
                    value="${escapeHTML(r.id)}"
                    class="mt-1"
                  >
                  <div>
                    <div class="flex items-center gap-2">
                      <i class="fas ${escapeHTML(r.icon)} text-orange-400"></i>
                      <span class="text-white font-medium">${escapeHTML(r.label)}</span>
                      <span class="px-1.5 py-0.5 rounded text-xs ${getSeverityColor(r.severity)}">
                        ${escapeHTML(r.severity)}
                      </span>
                    </div>
                    <p class="text-sm text-slate-400 mt-1">${escapeHTML(r.description)}</p>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Details textarea -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2" for="review-report-details">
              ${escapeHTML(t('reportDetails') || 'Details supplementaires (optionnel)')}
            </label>
            <textarea
              id="review-report-details"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="3"
              maxlength="500"
              placeholder="${escapeHTML(t('reportDetailsPlaceholder') || 'Donne-nous plus de details...')}"
            ></textarea>
            <p class="text-xs text-slate-500 mt-1">
              <span id="review-report-chars-count">0</span>/500 ${escapeHTML(t('characters') || 'caracteres')}
            </p>
          </div>

          <!-- Warning -->
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <p class="text-yellow-400 text-sm">
              <i class="fas fa-info-circle mr-2"></i>
              ${escapeHTML(t('reviewReportWarning') || 'Les faux signalements peuvent entrainer des sanctions sur ton compte.')}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-gray-800 flex gap-3">
          <button
            onclick="closeReviewReportModal()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="submitReviewReport('${escapeHTML(reviewId)}')"
            class="btn flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            id="submit-review-report-btn"
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
 * Render my reports list HTML
 * @returns {string} HTML string of reports list
 */
export function renderMyReviewReportsList() {
  const reports = getMyReviewReports();

  if (reports.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noReports') || 'Aucun signalement')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noReviewReportsDesc') || 'Tu n\'as signale aucun avis pour le moment')}</p>
      </div>
    `;
  }

  const listItems = reports.map(report => {
    const reason = getReportReasonById(report.reason);
    const cancelInfo = canCancelReviewReport(report.id);

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
              <span class="px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}">
                ${escapeHTML(report.severity)}
              </span>
              <span class="text-slate-500 text-xs">${escapeHTML(formatDate(report.createdAt))}</span>
            </div>
            <div class="flex items-center gap-2 text-white mb-1">
              <i class="fas ${escapeHTML(reason?.icon || 'fa-flag')} text-orange-400"></i>
              <span class="font-medium">${escapeHTML(reason?.label || report.reason)}</span>
            </div>
            <p class="text-sm text-slate-400">
              ${escapeHTML(t('reportedReview') || 'Avis signale')}: <span class="text-white">${escapeHTML(report.reviewId)}</span>
            </p>
            ${report.details ? `
              <p class="text-sm text-slate-500 mt-2 italic">"${escapeHTML(report.details)}"</p>
            ` : ''}
          </div>
          ${cancelInfo.canCancel ? `
            <div class="flex flex-col items-end gap-2">
              <button
                onclick="cancelReviewReportHandler('${escapeHTML(report.id)}')"
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
    <div class="review-reports-list space-y-3" role="list" aria-label="${escapeHTML(t('myReviewReports') || 'Mes signalements d\'avis')}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">
          <i class="fas fa-flag mr-2 text-orange-400"></i>
          ${escapeHTML(t('myReviewReports') || 'Mes signalements d\'avis')}
          <span class="text-sm font-normal text-slate-400 ml-2">(${reports.length})</span>
        </h3>
      </div>
      ${listItems}
    </div>
  `;
}

/**
 * Render moderation queue HTML (for moderators)
 * @returns {string} HTML string of moderation queue
 */
export function renderModerationQueue() {
  const queue = getModerationQueue();
  const stats = getReportStats();

  if (queue.length === 0) {
    return `
      <div class="moderation-queue">
        <div class="empty-state p-8 text-center" role="status">
          <div class="text-6xl mb-4">✨</div>
          <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('queueEmpty') || 'File de moderation vide')}</h3>
          <p class="text-slate-400 text-sm">${escapeHTML(t('noReportsToModerate') || 'Aucun signalement en attente')}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="moderation-queue">
      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-yellow-500/10 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">${stats.pending}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('pending') || 'En attente')}</div>
        </div>
        <div class="bg-red-500/10 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-400">${stats.bySeverity.high}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('highSeverity') || 'Haute priorite')}</div>
        </div>
        <div class="bg-green-500/10 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-400">${stats.actionTaken}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('actionTaken') || 'Actions prises')}</div>
        </div>
        <div class="bg-slate-500/10 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-slate-400">${stats.dismissed}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('dismissed') || 'Rejetes')}</div>
        </div>
      </div>

      <!-- Queue list -->
      <div class="space-y-3" role="list">
        ${queue.map(report => {
          const reason = getReportReasonById(report.reason);
          return `
            <div
              class="report-item p-4 bg-white/5 rounded-xl border-l-4 ${
                report.severity === 'high' ? 'border-red-500' :
                report.severity === 'medium' ? 'border-orange-500' : 'border-yellow-500'
              }"
              data-report-id="${escapeHTML(report.id)}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}">
                      ${escapeHTML(report.severity)}
                    </span>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}">
                      ${escapeHTML(getStatusLabel(report.status))}
                    </span>
                    <span class="text-slate-500 text-xs">${escapeHTML(formatDate(report.createdAt))}</span>
                  </div>
                  <div class="flex items-center gap-2 text-white mb-2">
                    <i class="fas ${escapeHTML(reason?.icon || 'fa-flag')} text-orange-400"></i>
                    <span class="font-medium">${escapeHTML(reason?.label || report.reason)}</span>
                  </div>
                  ${report.details ? `
                    <p class="text-sm text-slate-300 mb-2">"${escapeHTML(report.details)}"</p>
                  ` : ''}
                  <div class="text-xs text-slate-500">
                    Review: ${escapeHTML(report.reviewId)} | Spot: ${escapeHTML(report.spotId)}
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <button
                    onclick="moderateReport('${escapeHTML(report.id)}', 'action_taken')"
                    class="btn btn-sm bg-green-500/20 hover:bg-green-500/30 text-green-400"
                  >
                    <i class="fas fa-check mr-1"></i>
                    ${escapeHTML(t('takeAction') || 'Agir')}
                  </button>
                  <button
                    onclick="moderateReport('${escapeHTML(report.id)}', 'dismissed')"
                    class="btn btn-sm bg-slate-500/20 hover:bg-slate-500/30 text-slate-400"
                  >
                    <i class="fas fa-times mr-1"></i>
                    ${escapeHTML(t('dismiss') || 'Rejeter')}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Clear all review reports (for testing)
 * @returns {Object} Result object with success status
 */
export function clearAllReviewReports() {
  saveReportsToStorage([]);
  showToast(t('allReviewReportsCleared') || 'Tous les signalements d\'avis ont ete supprimes', 'success');
  return { success: true };
}

// Global handlers for onclick events
window.openReviewReportModal = (reviewId) => {
  setState({
    showReviewReportModal: true,
    reportReviewId: reviewId,
  });
};

window.closeReviewReportModal = () => {
  setState({
    showReviewReportModal: false,
    reportReviewId: null,
  });
};

window.submitReviewReport = (reviewId) => {
  const reasonInput = document.querySelector('input[name="review-report-reason"]:checked');
  const detailsTextarea = document.getElementById('review-report-details');

  const reason = reasonInput?.value || null;
  const details = detailsTextarea?.value || '';

  if (!reason) {
    showToast(t('selectReportReason') || 'Selectionne une raison', 'warning');
    return;
  }

  const result = reportReview(reviewId, reason, details);
  if (result.success) {
    window.closeReviewReportModal();
  }
};

window.cancelReviewReportHandler = (reportId) => {
  cancelReviewReport(reportId);
  setState({ refreshReviewReports: Date.now() });
};

window.moderateReport = (reportId, newStatus) => {
  const result = updateReportStatus(reportId, newStatus);
  if (result.success) {
    showToast(
      newStatus === 'action_taken'
        ? t('reportActionTaken') || 'Action prise sur le signalement'
        : t('reportDismissed') || 'Signalement rejete',
      'success'
    );
    setState({ refreshModerationQueue: Date.now() });
  }
};

window.updateReviewReportCharsCount = () => {
  const textarea = document.getElementById('review-report-details');
  const counter = document.getElementById('review-report-chars-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
};

// Export default with all functions
export default {
  ReportStatus,
  ReportReasons,
  getReportReasons,
  getReportReasonById,
  reportReview,
  hasReportedReview,
  getMyReviewReports,
  getReportById,
  cancelReviewReport,
  canCancelReviewReport,
  getModerationQueue,
  getReviewReportsByReviewId,
  getReviewReportCount,
  getReportStats,
  updateReportStatus,
  renderReportButton,
  renderReportModal,
  renderMyReviewReportsList,
  renderModerationQueue,
  clearAllReviewReports,
};
