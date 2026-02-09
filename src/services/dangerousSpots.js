/**
 * Dangerous Spots Service
 * Feature #83 - Spot dangereux (alerte)
 *
 * Gestion des alertes de spots dangereux avec proposition de suppression
 * Reasons: vol, agression, police hostile, route dangereuse, animaux sauvages
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage keys
const DANGEROUS_SPOTS_KEY = 'spothitch_dangerous_spots';
const DELETION_PROPOSALS_KEY = 'spothitch_deletion_proposals';

// Minimum reports to trigger automatic alert
const DANGER_THRESHOLD = 3;

// Minimum confirmations to propose deletion
const DELETION_THRESHOLD = 5;

/**
 * Alert status enum
 */
export const AlertStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DISMISSED: 'dismissed',
  RESOLVED: 'resolved',
};

/**
 * Deletion proposal status enum
 */
export const DeletionStatus = {
  PROPOSED: 'proposed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'deleted',
};

/**
 * Danger reasons enum with severity levels
 */
export const DangerReasons = {
  THEFT: {
    id: 'theft',
    label: 'Vol',
    labelEn: 'Theft',
    icon: 'fa-hand-holding-usd',
    emoji: '🦹',
    description: 'Vols frequents, pickpockets, agressions pour voler',
    descriptionEn: 'Frequent thefts, pickpockets, mugging',
    severity: 'high',
    color: 'red',
  },
  ASSAULT: {
    id: 'assault',
    label: 'Agression',
    labelEn: 'Assault',
    icon: 'fa-fist-raised',
    emoji: '👊',
    description: 'Agressions physiques ou verbales signalees',
    descriptionEn: 'Physical or verbal assaults reported',
    severity: 'critical',
    color: 'red',
  },
  HOSTILE_POLICE: {
    id: 'hostile_police',
    label: 'Police hostile',
    labelEn: 'Hostile Police',
    icon: 'fa-shield-alt',
    emoji: '🚔',
    description: 'Forces de l\'ordre hostiles aux autostoppeurs',
    descriptionEn: 'Law enforcement hostile to hitchhikers',
    severity: 'medium',
    color: 'orange',
  },
  DANGEROUS_ROAD: {
    id: 'dangerous_road',
    label: 'Route dangereuse',
    labelEn: 'Dangerous Road',
    icon: 'fa-road',
    emoji: '🚧',
    description: 'Circulation dense, manque de visibilite, pas d\'accotement',
    descriptionEn: 'Heavy traffic, poor visibility, no shoulder',
    severity: 'high',
    color: 'orange',
  },
  WILD_ANIMALS: {
    id: 'wild_animals',
    label: 'Animaux sauvages',
    labelEn: 'Wild Animals',
    icon: 'fa-paw',
    emoji: '🐺',
    description: 'Presence d\'animaux sauvages dangereux (ours, loups, sangliers)',
    descriptionEn: 'Presence of dangerous wild animals (bears, wolves, boars)',
    severity: 'medium',
    color: 'yellow',
  },
};

/**
 * Get dangerous spots from storage
 * @returns {Array} Array of dangerous spot alerts
 */
function getAlertsFromStorage() {
  try {
    const data = Storage.get(DANGEROUS_SPOTS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[DangerousSpots] Error reading alerts:', error);
    return [];
  }
}

/**
 * Save alerts to storage
 * @param {Array} alerts - Array of alert objects
 */
function saveAlertsToStorage(alerts) {
  try {
    Storage.set(DANGEROUS_SPOTS_KEY, alerts);
    setState({ dangerousSpotAlerts: alerts });
  } catch (error) {
    console.error('[DangerousSpots] Error saving alerts:', error);
  }
}

/**
 * Get deletion proposals from storage
 * @returns {Array} Array of deletion proposals
 */
function getProposalsFromStorage() {
  try {
    const data = Storage.get(DELETION_PROPOSALS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[DangerousSpots] Error reading proposals:', error);
    return [];
  }
}

/**
 * Save proposals to storage
 * @param {Array} proposals - Array of proposal objects
 */
function saveProposalsToStorage(proposals) {
  try {
    Storage.set(DELETION_PROPOSALS_KEY, proposals);
    setState({ deletionProposals: proposals });
  } catch (error) {
    console.error('[DangerousSpots] Error saving proposals:', error);
  }
}

/**
 * Generate unique alert ID
 * @returns {string} Unique alert ID
 */
function generateAlertId() {
  return `danger_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique proposal ID
 * @returns {string} Unique proposal ID
 */
function generateProposalId() {
  return `deletion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all available danger reasons
 * @returns {Array} Array of reason objects
 */
export function getDangerReasons() {
  return Object.values(DangerReasons);
}

/**
 * Get a specific danger reason by ID
 * @param {string} reasonId - The reason ID
 * @returns {Object|null} Reason object or null if not found
 */
export function getDangerReasonById(reasonId) {
  if (!reasonId) return null;
  return Object.values(DangerReasons).find(r => r.id === reasonId) || null;
}

/**
 * Report a dangerous spot
 * @param {string} spotId - ID of the spot to report
 * @param {string} reason - Reason ID for reporting
 * @param {string} details - Additional details about the danger
 * @returns {Object} Result object with success status and alert data
 */
export function reportDangerousSpot(spotId, reason, details = '') {
  if (!spotId) {
    return { success: false, error: 'spot_id_required' };
  }

  if (!reason) {
    return { success: false, error: 'reason_required' };
  }

  // Validate reason
  const validReason = getDangerReasonById(reason);
  if (!validReason) {
    return { success: false, error: 'invalid_reason' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const alerts = getAlertsFromStorage();

  // Check if user already reported this spot for the same reason
  const existingAlert = alerts.find(
    a => a.spotId === spotId &&
      a.reporterId === currentUserId &&
      a.reason === reason &&
      a.status !== AlertStatus.DISMISSED
  );

  if (existingAlert) {
    showToast(t('spotAlreadyReported') || 'Tu as deja signale ce danger pour ce spot', 'warning');
    return { success: false, error: 'already_reported' };
  }

  // Create alert entry
  const alert = {
    id: generateAlertId(),
    spotId,
    reason,
    severity: validReason.severity,
    details: details.trim(),
    reporterId: currentUserId,
    status: AlertStatus.PENDING,
    confirmations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to alerts list
  alerts.push(alert);
  saveAlertsToStorage(alerts);

  // Check if we should auto-trigger danger alert
  const spotAlerts = alerts.filter(
    a => a.spotId === spotId && a.status !== AlertStatus.DISMISSED
  );

  if (spotAlerts.length >= DANGER_THRESHOLD) {
    // Auto-confirm the most severe alert
    const mostSevere = spotAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    })[0];

    if (mostSevere && mostSevere.status === AlertStatus.PENDING) {
      mostSevere.status = AlertStatus.CONFIRMED;
      mostSevere.updatedAt = new Date().toISOString();
      saveAlertsToStorage(alerts);
    }
  }

  showToast(t('dangerReportSubmitted') || 'Signalement de danger envoye. Merci pour ta vigilance !', 'success');

  return { success: true, alert };
}

/**
 * Get all dangerous spots (alerts with status confirmed or pending)
 * @returns {Array} Array of dangerous spot objects
 */
export function getDangerousSpots() {
  const alerts = getAlertsFromStorage();

  // Group alerts by spotId
  const spotAlerts = {};
  alerts
    .filter(a => a.status === AlertStatus.CONFIRMED || a.status === AlertStatus.PENDING)
    .forEach(alert => {
      if (!spotAlerts[alert.spotId]) {
        spotAlerts[alert.spotId] = {
          spotId: alert.spotId,
          alerts: [],
          reasons: new Set(),
          highestSeverity: 'low',
          reportCount: 0,
          confirmationCount: 0,
          latestReport: null,
        };
      }
      spotAlerts[alert.spotId].alerts.push(alert);
      spotAlerts[alert.spotId].reasons.add(alert.reason);
      spotAlerts[alert.spotId].reportCount++;
      spotAlerts[alert.spotId].confirmationCount += (alert.confirmations?.length || 0) + 1;

      // Update highest severity
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if ((severityOrder[alert.severity] || 3) < (severityOrder[spotAlerts[alert.spotId].highestSeverity] || 3)) {
        spotAlerts[alert.spotId].highestSeverity = alert.severity;
      }

      // Update latest report date
      if (!spotAlerts[alert.spotId].latestReport ||
          new Date(alert.createdAt) > new Date(spotAlerts[alert.spotId].latestReport)) {
        spotAlerts[alert.spotId].latestReport = alert.createdAt;
      }
    });

  // Convert to array and add reasons as array
  return Object.values(spotAlerts).map(spot => ({
    ...spot,
    reasons: Array.from(spot.reasons),
  }));
}

/**
 * Get alerts for a specific spot
 * @param {string} spotId - The spot ID
 * @returns {Array} Array of alerts for this spot
 */
export function getSpotAlerts(spotId) {
  if (!spotId) return [];
  const alerts = getAlertsFromStorage();
  return alerts.filter(a => a.spotId === spotId);
}

/**
 * Get alert by ID
 * @param {string} alertId - The alert ID
 * @returns {Object|null} Alert object or null
 */
export function getAlertById(alertId) {
  if (!alertId) return null;
  const alerts = getAlertsFromStorage();
  return alerts.find(a => a.id === alertId) || null;
}

/**
 * Check if a spot is marked as dangerous
 * @param {string} spotId - The spot ID
 * @returns {boolean} True if spot has confirmed danger alerts
 */
export function isSpotDangerous(spotId) {
  if (!spotId) return false;
  const alerts = getAlertsFromStorage();
  return alerts.some(
    a => a.spotId === spotId && a.status === AlertStatus.CONFIRMED
  );
}

/**
 * Get danger level for a spot
 * @param {string} spotId - The spot ID
 * @returns {Object} Object with level and details
 */
export function getSpotDangerLevel(spotId) {
  if (!spotId) return { level: 'safe', severity: null, reasons: [] };

  const alerts = getAlertsFromStorage();
  const spotAlerts = alerts.filter(
    a => a.spotId === spotId &&
      (a.status === AlertStatus.CONFIRMED || a.status === AlertStatus.PENDING)
  );

  if (spotAlerts.length === 0) {
    return { level: 'safe', severity: null, reasons: [] };
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const highestSeverity = spotAlerts.reduce((highest, alert) => {
    return (severityOrder[alert.severity] || 3) < (severityOrder[highest] || 3)
      ? alert.severity
      : highest;
  }, 'low');

  const reasons = [...new Set(spotAlerts.map(a => a.reason))];
  const hasConfirmed = spotAlerts.some(a => a.status === AlertStatus.CONFIRMED);

  let level = 'safe';
  if (hasConfirmed) {
    level = highestSeverity === 'critical' ? 'critical' : 'dangerous';
  } else if (spotAlerts.length >= 2) {
    level = 'warning';
  } else {
    level = 'caution';
  }

  return {
    level,
    severity: highestSeverity,
    reasons,
    alertCount: spotAlerts.length,
    hasConfirmed,
  };
}

/**
 * Confirm a dangerous spot report
 * @param {string} spotId - ID of the spot
 * @param {string} alertId - ID of the alert (optional, confirms most recent if not provided)
 * @returns {Object} Result object with success status
 */
export function confirmDangerousSpot(spotId, alertId = null) {
  if (!spotId) {
    return { success: false, error: 'spot_id_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const alerts = getAlertsFromStorage();
  let alert;

  if (alertId) {
    alert = alerts.find(a => a.id === alertId && a.spotId === spotId);
  } else {
    // Find the most recent pending alert for this spot
    alert = alerts
      .filter(a => a.spotId === spotId && a.status === AlertStatus.PENDING)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  if (!alert) {
    return { success: false, error: 'alert_not_found' };
  }

  // Cannot confirm own report
  if (alert.reporterId === currentUserId) {
    showToast(t('cannotConfirmOwnReport') || 'Tu ne peux pas confirmer ton propre signalement', 'warning');
    return { success: false, error: 'cannot_confirm_own' };
  }

  // Check if already confirmed by this user
  if (alert.confirmations?.includes(currentUserId)) {
    showToast(t('alreadyConfirmedDanger') || 'Tu as deja confirme ce danger', 'warning');
    return { success: false, error: 'already_confirmed' };
  }

  // Add confirmation
  if (!alert.confirmations) {
    alert.confirmations = [];
  }
  alert.confirmations.push(currentUserId);
  alert.updatedAt = new Date().toISOString();

  // Auto-confirm if threshold reached
  const totalConfirmations = alert.confirmations.length + 1; // +1 for original reporter
  if (totalConfirmations >= DANGER_THRESHOLD) {
    alert.status = AlertStatus.CONFIRMED;
  }

  // Check if we should propose deletion
  if (totalConfirmations >= DELETION_THRESHOLD) {
    proposeDeletion(spotId, alert.id);
  }

  saveAlertsToStorage(alerts);

  showToast(t('dangerConfirmed') || 'Danger confirme. Merci pour ta contribution !', 'success');

  return { success: true, alert, totalConfirmations };
}

/**
 * Dismiss a danger alert (for moderators or if danger is resolved)
 * @param {string} alertId - ID of the alert to dismiss
 * @param {string} reason - Reason for dismissal
 * @returns {Object} Result object with success status
 */
export function dismissDangerAlert(alertId, reason = '') {
  if (!alertId) {
    return { success: false, error: 'alert_id_required' };
  }

  const alerts = getAlertsFromStorage();
  const alertIndex = alerts.findIndex(a => a.id === alertId);

  if (alertIndex === -1) {
    return { success: false, error: 'alert_not_found' };
  }

  alerts[alertIndex].status = AlertStatus.DISMISSED;
  alerts[alertIndex].dismissalReason = reason;
  alerts[alertIndex].updatedAt = new Date().toISOString();

  saveAlertsToStorage(alerts);

  return { success: true };
}

/**
 * Resolve a danger alert (danger has been addressed)
 * @param {string} alertId - ID of the alert to resolve
 * @param {string} resolution - How the danger was resolved
 * @returns {Object} Result object with success status
 */
export function resolveDangerAlert(alertId, resolution = '') {
  if (!alertId) {
    return { success: false, error: 'alert_id_required' };
  }

  const alerts = getAlertsFromStorage();
  const alertIndex = alerts.findIndex(a => a.id === alertId);

  if (alertIndex === -1) {
    return { success: false, error: 'alert_not_found' };
  }

  alerts[alertIndex].status = AlertStatus.RESOLVED;
  alerts[alertIndex].resolution = resolution;
  alerts[alertIndex].updatedAt = new Date().toISOString();

  saveAlertsToStorage(alerts);

  showToast(t('dangerResolved') || 'Danger marque comme resolu', 'success');

  return { success: true };
}

/**
 * Propose deletion of a dangerous spot
 * @param {string} spotId - ID of the spot
 * @param {string} alertId - ID of the triggering alert (optional)
 * @returns {Object} Result object with success status and proposal
 */
export function proposeDeletion(spotId, alertId = null) {
  if (!spotId) {
    return { success: false, error: 'spot_id_required' };
  }

  const proposals = getProposalsFromStorage();

  // Check if already proposed
  const existingProposal = proposals.find(
    p => p.spotId === spotId && p.status === DeletionStatus.PROPOSED
  );

  if (existingProposal) {
    return { success: false, error: 'already_proposed', proposal: existingProposal };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  // Get danger info
  const dangerLevel = getSpotDangerLevel(spotId);

  const proposal = {
    id: generateProposalId(),
    spotId,
    triggeringAlertId: alertId,
    proposedBy: currentUserId,
    status: DeletionStatus.PROPOSED,
    dangerLevel: dangerLevel.level,
    dangerReasons: dangerLevel.reasons,
    votes: {
      approve: [],
      reject: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  proposals.push(proposal);
  saveProposalsToStorage(proposals);

  showToast(t('deletionProposed') || 'Proposition de suppression soumise', 'info');

  return { success: true, proposal };
}

/**
 * Vote on a deletion proposal
 * @param {string} proposalId - ID of the proposal
 * @param {string} vote - 'approve' or 'reject'
 * @returns {Object} Result object with success status
 */
export function voteOnDeletion(proposalId, vote) {
  if (!proposalId) {
    return { success: false, error: 'proposal_id_required' };
  }

  if (!['approve', 'reject'].includes(vote)) {
    return { success: false, error: 'invalid_vote' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const proposals = getProposalsFromStorage();
  const proposal = proposals.find(p => p.id === proposalId);

  if (!proposal) {
    return { success: false, error: 'proposal_not_found' };
  }

  if (proposal.status !== DeletionStatus.PROPOSED) {
    return { success: false, error: 'proposal_closed' };
  }

  // Remove previous vote if exists
  proposal.votes.approve = proposal.votes.approve.filter(id => id !== currentUserId);
  proposal.votes.reject = proposal.votes.reject.filter(id => id !== currentUserId);

  // Add new vote
  proposal.votes[vote].push(currentUserId);
  proposal.updatedAt = new Date().toISOString();

  // Check if decision can be made (simple majority with min 5 votes)
  const totalVotes = proposal.votes.approve.length + proposal.votes.reject.length;
  if (totalVotes >= 5) {
    if (proposal.votes.approve.length > proposal.votes.reject.length) {
      proposal.status = DeletionStatus.APPROVED;
      showToast(t('spotMarkedForDeletion') || 'Spot approuve pour suppression', 'warning');
    } else if (proposal.votes.reject.length > proposal.votes.approve.length) {
      proposal.status = DeletionStatus.REJECTED;
    }
  }

  saveProposalsToStorage(proposals);

  showToast(vote === 'approve'
    ? (t('votedForDeletion') || 'Vote pour la suppression enregistre')
    : (t('votedAgainstDeletion') || 'Vote contre la suppression enregistre'),
    'success'
  );

  return { success: true, proposal };
}

/**
 * Get deletion proposal for a spot
 * @param {string} spotId - The spot ID
 * @returns {Object|null} Proposal object or null
 */
export function getDeletionProposal(spotId) {
  if (!spotId) return null;
  const proposals = getProposalsFromStorage();
  return proposals.find(p => p.spotId === spotId && p.status === DeletionStatus.PROPOSED) || null;
}

/**
 * Get all pending deletion proposals
 * @returns {Array} Array of pending proposals
 */
export function getPendingDeletionProposals() {
  const proposals = getProposalsFromStorage();
  return proposals.filter(p => p.status === DeletionStatus.PROPOSED);
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
 * Render danger alert banner for a spot
 * @param {Object} spot - The spot object (must have id)
 * @returns {string} HTML string of danger alert
 */
export function renderDangerAlert(spot) {
  if (!spot || !spot.id) return '';

  const dangerLevel = getSpotDangerLevel(spot.id);

  if (dangerLevel.level === 'safe') {
    return '';
  }

  const reasons = dangerLevel.reasons.map(r => {
    const reason = getDangerReasonById(r);
    return reason ? `${reason.emoji} ${reason.label}` : r;
  }).join(', ');

  const levelColors = {
    critical: 'bg-red-600 border-red-700',
    dangerous: 'bg-red-500 border-red-600',
    warning: 'bg-orange-500 border-orange-600',
    caution: 'bg-yellow-500 border-yellow-600',
  };

  const levelLabels = {
    critical: t('dangerCritical') || 'DANGER CRITIQUE',
    dangerous: t('dangerDangerous') || 'SPOT DANGEREUX',
    warning: t('dangerWarning') || 'ATTENTION',
    caution: t('dangerCaution') || 'PRUDENCE',
  };

  const levelIcons = {
    critical: 'fa-skull-crossbones',
    dangerous: 'fa-exclamation-triangle',
    warning: 'fa-exclamation-circle',
    caution: 'fa-info-circle',
  };

  const colorClass = levelColors[dangerLevel.level] || 'bg-yellow-500 border-yellow-600';
  const label = levelLabels[dangerLevel.level] || 'ATTENTION';
  const icon = levelIcons[dangerLevel.level] || 'fa-exclamation-circle';

  const proposal = getDeletionProposal(spot.id);
  const deletionSection = proposal ? `
    <div class="mt-3 pt-3 border-t border-white/20">
      <p class="text-white/90 text-sm mb-2">
        <i class="fas fa-trash-alt mr-1"></i>
        ${escapeHTML(t('deletionProposed') || 'Suppression proposee')}
      </p>
      <div class="flex gap-2">
        <button
          onclick="voteDeletion('${escapeHTML(proposal.id)}', 'approve')"
          class="btn btn-sm bg-white/20 hover:bg-white/30 text-white flex-1"
          aria-label="${escapeHTML(t('approveDelete') || 'Approuver la suppression')}"
        >
          <i class="fas fa-check mr-1"></i>
          ${escapeHTML(t('approve') || 'Approuver')} (${proposal.votes.approve.length})
        </button>
        <button
          onclick="voteDeletion('${escapeHTML(proposal.id)}', 'reject')"
          class="btn btn-sm bg-white/20 hover:bg-white/30 text-white flex-1"
          aria-label="${escapeHTML(t('rejectDelete') || 'Rejeter la suppression')}"
        >
          <i class="fas fa-times mr-1"></i>
          ${escapeHTML(t('reject') || 'Rejeter')} (${proposal.votes.reject.length})
        </button>
      </div>
    </div>
  ` : '';

  return `
    <div
      class="danger-alert ${colorClass} border-l-4 rounded-lg p-4 mb-4"
      role="alert"
      aria-live="assertive"
      data-spot-id="${escapeHTML(spot.id)}"
      data-danger-level="${escapeHTML(dangerLevel.level)}"
    >
      <div class="flex items-start gap-3">
        <div class="text-2xl">
          <i class="fas ${icon} text-white"></i>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-white text-lg">${escapeHTML(label)}</h3>
          <p class="text-white/90 text-sm mt-1">
            ${escapeHTML(reasons)}
          </p>
          <p class="text-white/70 text-xs mt-2">
            ${dangerLevel.alertCount} ${escapeHTML(t('reports') || 'signalement(s)')}
            ${dangerLevel.hasConfirmed ? ` - ${escapeHTML(t('confirmedDanger') || 'Confirme')}` : ''}
          </p>
          <div class="mt-3 flex gap-2 flex-wrap">
            <button
              onclick="confirmSpotDanger('${escapeHTML(spot.id)}')"
              class="btn btn-sm bg-white/20 hover:bg-white/30 text-white"
              aria-label="${escapeHTML(t('confirmDanger') || 'Confirmer le danger')}"
            >
              <i class="fas fa-check mr-1"></i>
              ${escapeHTML(t('confirmDanger') || 'Confirmer')}
            </button>
            <button
              onclick="reportSpotDanger('${escapeHTML(spot.id)}')"
              class="btn btn-sm bg-white/20 hover:bg-white/30 text-white"
              aria-label="${escapeHTML(t('reportNewDanger') || 'Signaler un autre danger')}"
            >
              <i class="fas fa-plus mr-1"></i>
              ${escapeHTML(t('reportNewDanger') || 'Autre danger')}
            </button>
          </div>
          ${deletionSection}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render danger report modal
 * @param {string} spotId - The spot ID
 * @returns {string} HTML string of report modal
 */
export function renderDangerReportModal(spotId) {
  if (!spotId) return '';

  const reasons = getDangerReasons();

  return `
    <div
      class="danger-report-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeDangerReportModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-report-modal-title"
    >
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-red-500 to-orange-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="danger-report-modal-title" class="text-xl font-bold text-white">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${escapeHTML(t('reportDangerTitle') || 'Signaler un danger')}
              </h2>
              <p class="text-white/80 text-sm mt-1">
                ${escapeHTML(t('reportDangerSubtitle') || 'Aide la communaute en signalant les spots dangereux')}
              </p>
            </div>
            <button
              onclick="closeDangerReportModal()"
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
            ${escapeHTML(t('reportDangerDescription') || 'Quel type de danger as-tu rencontre ou observe a ce spot ?')}
          </p>

          <!-- Reason selection -->
          <div class="mb-4 space-y-2">
            ${reasons.map(r => `
              <label class="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="danger-reason"
                  value="${escapeHTML(r.id)}"
                  class="mt-1"
                >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${escapeHTML(r.emoji)}</span>
                    <span class="text-white font-medium">${escapeHTML(r.label)}</span>
                    <span class="px-1.5 py-0.5 rounded text-xs ${
                      r.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      r.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }">
                      ${escapeHTML(r.severity)}
                    </span>
                  </div>
                  <p class="text-sm text-slate-400 mt-1">${escapeHTML(r.description)}</p>
                </div>
              </label>
            `).join('')}
          </div>

          <!-- Details textarea -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2" for="danger-details">
              ${escapeHTML(t('dangerDetails') || 'Details (optionnel)')}
            </label>
            <textarea
              id="danger-details"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="3"
              maxlength="500"
              placeholder="${escapeHTML(t('dangerDetailsPlaceholder') || 'Decris la situation (date, heure, circonstances)...')}"
            ></textarea>
          </div>

          <!-- Warning -->
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p class="text-red-400 text-sm">
              <i class="fas fa-info-circle mr-2"></i>
              ${escapeHTML(t('dangerReportWarning') || 'Les faux signalements peuvent entrainer des sanctions. Signale uniquement les vrais dangers.')}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-gray-800 flex gap-3">
          <button
            onclick="closeDangerReportModal()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="submitDangerReport('${escapeHTML(spotId)}')"
            class="btn flex-1 bg-red-500 hover:bg-red-600 text-white"
            id="submit-danger-report-btn"
          >
            <i class="fas fa-exclamation-triangle mr-2"></i>
            ${escapeHTML(t('submitDangerReport') || 'Signaler le danger')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render small danger badge for spot cards
 * @param {string} spotId - The spot ID
 * @returns {string} HTML string of danger badge
 */
export function renderDangerBadge(spotId) {
  if (!spotId) return '';

  const dangerLevel = getSpotDangerLevel(spotId);

  if (dangerLevel.level === 'safe') {
    return '';
  }

  const badgeColors = {
    critical: 'bg-red-600 text-white',
    dangerous: 'bg-red-500 text-white',
    warning: 'bg-orange-500 text-white',
    caution: 'bg-yellow-500 text-black',
  };

  const badgeIcons = {
    critical: 'fa-skull-crossbones',
    dangerous: 'fa-exclamation-triangle',
    warning: 'fa-exclamation-circle',
    caution: 'fa-info-circle',
  };

  const colorClass = badgeColors[dangerLevel.level] || 'bg-yellow-500 text-black';
  const icon = badgeIcons[dangerLevel.level] || 'fa-exclamation-circle';

  return `
    <span
      class="danger-badge ${colorClass} px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"
      aria-label="${escapeHTML(t('dangerBadge') || 'Spot signale comme dangereux')}"
      data-danger-level="${escapeHTML(dangerLevel.level)}"
    >
      <i class="fas ${icon}"></i>
      <span class="sr-only">${escapeHTML(dangerLevel.level)}</span>
    </span>
  `;
}

/**
 * Get danger statistics
 * @returns {Object} Statistics object
 */
export function getDangerStats() {
  const alerts = getAlertsFromStorage();
  const proposals = getProposalsFromStorage();

  const stats = {
    totalAlerts: alerts.length,
    pendingAlerts: alerts.filter(a => a.status === AlertStatus.PENDING).length,
    confirmedAlerts: alerts.filter(a => a.status === AlertStatus.CONFIRMED).length,
    dismissedAlerts: alerts.filter(a => a.status === AlertStatus.DISMISSED).length,
    resolvedAlerts: alerts.filter(a => a.status === AlertStatus.RESOLVED).length,
    deletionProposals: proposals.length,
    pendingDeletions: proposals.filter(p => p.status === DeletionStatus.PROPOSED).length,
    approvedDeletions: proposals.filter(p => p.status === DeletionStatus.APPROVED).length,
    byReason: {},
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
    },
  };

  // Count by reason
  alerts.forEach(alert => {
    const reason = alert.reason || 'unknown';
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
  });

  return stats;
}

/**
 * Clear all danger data (for testing/reset)
 * @returns {Object} Result object with success status
 */
export function clearAllDangerData() {
  saveAlertsToStorage([]);
  saveProposalsToStorage([]);
  showToast(t('allDangerDataCleared') || 'Toutes les donnees de danger ont ete supprimees', 'success');
  return { success: true };
}

// Global handlers for onclick events
window.reportSpotDanger = (spotId) => {
  setState({
    showDangerReportModal: true,
    dangerReportSpotId: spotId,
  });
};

window.closeDangerReportModal = () => {
  setState({
    showDangerReportModal: false,
    dangerReportSpotId: null,
  });
};

window.submitDangerReport = (spotId) => {
  const reasonInput = document.querySelector('input[name="danger-reason"]:checked');
  const detailsTextarea = document.getElementById('danger-details');

  const reason = reasonInput?.value || null;
  const details = detailsTextarea?.value || '';

  if (!reason) {
    showToast(t('selectDangerReason') || 'Selectionne un type de danger', 'warning');
    return;
  }

  const result = reportDangerousSpot(spotId, reason, details);
  if (result.success) {
    window.closeDangerReportModal();
  }
};

window.confirmSpotDanger = (spotId) => {
  confirmDangerousSpot(spotId);
};

window.voteDeletion = (proposalId, vote) => {
  voteOnDeletion(proposalId, vote);
};

// Export default with all functions
export default {
  AlertStatus,
  DeletionStatus,
  DangerReasons,
  getDangerReasons,
  getDangerReasonById,
  reportDangerousSpot,
  getDangerousSpots,
  getSpotAlerts,
  getAlertById,
  isSpotDangerous,
  getSpotDangerLevel,
  confirmDangerousSpot,
  dismissDangerAlert,
  resolveDangerAlert,
  proposeDeletion,
  voteOnDeletion,
  getDeletionProposal,
  getPendingDeletionProposals,
  renderDangerAlert,
  renderDangerReportModal,
  renderDangerBadge,
  getDangerStats,
  clearAllDangerData,
};
