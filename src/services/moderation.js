/**
 * Moderation Service
 * Advanced reporting and content moderation
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Report types
export const REPORT_TYPES = {
  SPOT: {
    INACCURATE: { id: 'inaccurate', label: 'Information incorrecte', icon: 'fa-exclamation-circle', severity: 'medium' },
    DANGEROUS: { id: 'dangerous', label: 'Endroit dangereux', icon: 'fa-skull-crossbones', severity: 'high' },
    INAPPROPRIATE: { id: 'inappropriate', label: 'Contenu inapproprié', icon: 'fa-ban', severity: 'high' },
    DUPLICATE: { id: 'duplicate', label: 'Spot en double', icon: 'fa-clone', severity: 'low' },
    CLOSED: { id: 'closed', label: 'Spot fermé/inaccessible', icon: 'fa-lock', severity: 'medium' },
    OTHER: { id: 'other', label: 'Autre problème', icon: 'fa-question-circle', severity: 'low' },
  },
  USER: {
    SPAM: { id: 'spam', label: 'Spam / Publicité', icon: 'fa-ad', severity: 'medium' },
    HARASSMENT: { id: 'harassment', label: 'Harcèlement', icon: 'fa-user-slash', severity: 'high' },
    FAKE: { id: 'fake', label: 'Faux profil', icon: 'fa-user-secret', severity: 'medium' },
    INAPPROPRIATE: { id: 'inappropriate', label: 'Comportement inapproprié', icon: 'fa-ban', severity: 'high' },
    OTHER: { id: 'other', label: 'Autre', icon: 'fa-question-circle', severity: 'low' },
  },
  MESSAGE: {
    SPAM: { id: 'spam', label: 'Spam', icon: 'fa-ad', severity: 'medium' },
    HARASSMENT: { id: 'harassment', label: 'Harcèlement', icon: 'fa-angry', severity: 'high' },
    HATE: { id: 'hate', label: 'Discours haineux', icon: 'fa-fire', severity: 'critical' },
    INAPPROPRIATE: { id: 'inappropriate', label: 'Contenu inapproprié', icon: 'fa-ban', severity: 'high' },
    OTHER: { id: 'other', label: 'Autre', icon: 'fa-question-circle', severity: 'low' },
  },
};

// Severity levels
export const SEVERITY_LEVELS = {
  low: { color: 'text-slate-400', bg: 'bg-slate-500/20', priority: 1 },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', priority: 2 },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', priority: 3 },
  critical: { color: 'text-danger-400', bg: 'bg-danger-500/20', priority: 4 },
};

/**
 * Submit a report
 * @param {string} type - 'spot', 'user', or 'message'
 * @param {string} targetId - ID of the reported item
 * @param {string} reason - Report reason ID
 * @param {Object} details - Additional details
 */
export async function submitReport(type, targetId, reason, details = {}) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  // Check for duplicate reports
  const recentReports = state.userReports || [];
  const duplicateReport = recentReports.find(r =>
    r.type === type && r.targetId === targetId && r.reason === reason &&
    Date.now() - new Date(r.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24 hours
  );

  if (duplicateReport) {
    showToast('Tu as déjà signalé cet élément', 'warning');
    return false;
  }

  // Get report type info
  const reportTypeMap = {
    spot: REPORT_TYPES.SPOT,
    user: REPORT_TYPES.USER,
    message: REPORT_TYPES.MESSAGE,
  };
  const reasonInfo = reportTypeMap[type]?.[reason.toUpperCase()] || { severity: 'low' };

  // Create report
  const report = {
    id: generateReportId(),
    type,
    targetId,
    reason,
    severity: reasonInfo.severity,
    details: {
      description: details.description || '',
      screenshots: details.screenshots || [],
      additionalInfo: details.additionalInfo || '',
    },
    reporter: {
      id: userId,
      username: state.username || 'Anonyme',
      trustScore: state.trustScore || 50,
    },
    status: 'pending',
    timestamp: new Date().toISOString(),
    votes: 1, // Reporter's vote
  };

  // Save report to state (in production, this would go to Firebase)
  const reports = state.reports || [];
  reports.push(report);

  // Track user's reports
  const userReports = state.userReports || [];
  userReports.push({
    type,
    targetId,
    reason,
    timestamp: report.timestamp,
  });

  setState({
    reports,
    userReports,
  });

  // Apply automatic actions for high severity
  if (reasonInfo.severity === 'critical' || reasonInfo.severity === 'high') {
    await handleHighSeverityReport(report);
  }

  showToast('Signalement envoyé. Merci pour ta vigilance !', 'success');

  return report;
}

/**
 * Handle high severity reports automatically
 */
async function handleHighSeverityReport(report) {
  const state = getState();

  if (report.type === 'spot') {
    // Mark spot as under review
    const spots = state.spots.map(s => {
      if (s.id.toString() === report.targetId.toString()) {
        return {
          ...s,
          underReview: true,
          reviewReason: report.reason,
        };
      }
      return s;
    });
    setState({ spots });
  }

  // Log for admin review
  console.log('High severity report requires review:', report);
}

/**
 * Vote on an existing report (community moderation)
 * @param {string} reportId - Report ID
 * @param {boolean} agree - Whether user agrees with the report
 */
export async function voteOnReport(reportId, agree) {
  const state = getState();
  const reports = state.reports || [];

  const reportIndex = reports.findIndex(r => r.id === reportId);
  if (reportIndex === -1) return false;

  const report = reports[reportIndex];

  // Check if user already voted
  const userId = state.user?.uid || 'anonymous';
  const voters = report.voters || [];

  if (voters.includes(userId)) {
    showToast('Tu as déjà voté sur ce signalement', 'warning');
    return false;
  }

  // Update vote count
  report.votes += agree ? 1 : -1;
  report.voters = [...voters, userId];

  // Check if report should be auto-resolved
  if (report.votes >= 5) {
    report.status = 'confirmed';
    await handleConfirmedReport(report);
  } else if (report.votes <= -3) {
    report.status = 'dismissed';
  }

  reports[reportIndex] = report;
  setState({ reports });

  showToast(agree ? 'Vote enregistré' : 'Merci pour ton avis', 'success');

  return true;
}

/**
 * Handle confirmed report (enough community votes)
 */
async function handleConfirmedReport(report) {
  const state = getState();

  if (report.type === 'spot') {
    // Apply penalties based on reason
    const spots = state.spots.map(s => {
      if (s.id.toString() === report.targetId.toString()) {
        switch (report.reason) {
          case 'dangerous':
            return { ...s, verificationStatus: 'dangerous', hidden: true };
          case 'closed':
            return { ...s, status: 'closed', verificationStatus: 'needs_update' };
          case 'inappropriate':
            return { ...s, hidden: true };
          default:
            return { ...s, verificationStatus: 'disputed' };
        }
      }
      return s;
    });
    setState({ spots });
  }

  showToast('Le signalement a été confirmé par la communauté', 'info');
}

/**
 * Get reports for an item
 */
export function getReportsForItem(type, targetId) {
  const state = getState();
  return (state.reports || []).filter(r =>
    r.type === type && r.targetId.toString() === targetId.toString()
  );
}

/**
 * Check if item is under review
 */
export function isUnderReview(type, targetId) {
  const reports = getReportsForItem(type, targetId);
  return reports.some(r => r.status === 'pending' && ['high', 'critical'].includes(r.severity));
}

/**
 * Generate unique report ID
 */
function generateReportId() {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Render report modal
 */
export function renderReportModal(state) {
  if (!state.showReport) return '';

  const { reportType = 'spot', reportTargetId } = state;
  const reportTypes = REPORT_TYPES[reportType.toUpperCase()] || REPORT_TYPES.SPOT;

  return `
    <div
      class="report-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
      onclick="if(event.target===this)closeReport()"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-gray-900 w-full sm:max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 to-red-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold text-white">Signaler</h2>
              <p class="text-white/80 text-sm">Aide-nous à garder la communauté sûre</p>
            </div>
            <button onclick="closeReport()" class="p-2 bg-white/20 rounded-full text-white">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Report reasons -->
        <div class="p-4 overflow-y-auto max-h-[60vh]">
          <p class="text-sm text-slate-400 mb-4">Pourquoi signales-tu cet élément ?</p>

          <div class="space-y-2">
            ${Object.entries(reportTypes).map(([key, reason]) => `
              <button
                onclick="selectReportReason('${reason.id}')"
                class="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left flex items-center gap-3 ${state.selectedReportReason === reason.id ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''}"
              >
                <div class="w-10 h-10 rounded-lg ${SEVERITY_LEVELS[reason.severity].bg} flex items-center justify-center">
                  <i class="fas ${reason.icon} ${SEVERITY_LEVELS[reason.severity].color}"></i>
                </div>
                <div class="flex-1">
                  <div class="font-medium">${reason.label}</div>
                  <div class="text-xs ${SEVERITY_LEVELS[reason.severity].color}">
                    Priorité ${reason.severity === 'low' ? 'basse' : reason.severity === 'medium' ? 'moyenne' : 'haute'}
                  </div>
                </div>
                ${state.selectedReportReason === reason.id ? '<i class="fas fa-check text-primary-400"></i>' : ''}
              </button>
            `).join('')}
          </div>

          <!-- Additional details -->
          ${state.selectedReportReason ? `
            <div class="mt-4">
              <label class="block text-sm text-slate-400 mb-2">Détails supplémentaires (optionnel)</label>
              <textarea
                id="report-details"
                class="input-modern h-24 resize-none"
                placeholder="Décris le problème en détail..."
              ></textarea>
            </div>
          ` : ''}
        </div>

        <!-- Submit button -->
        <div class="p-4 border-t border-gray-800">
          <button
            onclick="submitCurrentReport()"
            class="btn btn-danger w-full"
            ${!state.selectedReportReason ? 'disabled' : ''}
          >
            <i class="fas fa-flag mr-2"></i>
            Envoyer le signalement
          </button>
          <p class="text-xs text-slate-500 text-center mt-2">
            Les faux signalements peuvent entraîner des sanctions
          </p>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openReport = (type, targetId) => {
  setState({
    showReport: true,
    reportType: type,
    reportTargetId: targetId,
    selectedReportReason: null,
  });
};

window.closeReport = () => {
  setState({
    showReport: false,
    reportType: null,
    reportTargetId: null,
    selectedReportReason: null,
  });
};

window.selectReportReason = (reason) => {
  setState({ selectedReportReason: reason });
};

window.submitCurrentReport = async () => {
  const state = getState();
  const details = document.getElementById('report-details')?.value || '';

  const result = await submitReport(
    state.reportType,
    state.reportTargetId,
    state.selectedReportReason,
    { description: details }
  );

  if (result) {
    window.closeReport();
  }
};

export default {
  REPORT_TYPES,
  SEVERITY_LEVELS,
  submitReport,
  voteOnReport,
  getReportsForItem,
  isUnderReview,
  renderReportModal,
};
