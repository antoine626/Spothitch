/**
 * Spot Corrections Service
 * Feature #85 - Proposer une correction de spot
 *
 * Permet aux utilisateurs de proposer des corrections sur les informations des spots.
 * Les corrections sont soumises a un vote communautaire pour validation.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key for corrections
const CORRECTIONS_STORAGE_KEY = 'spothitch_spot_corrections';

// Constants
export const VOTES_REQUIRED_TO_APPROVE = 5;
export const VOTES_REQUIRED_TO_REJECT = 3;
export const CORRECTION_EXPIRY_DAYS = 14;
export const CORRECTION_EXPIRY_MS = CORRECTION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
export const POINTS_FOR_APPROVED_CORRECTION = 15;
export const POINTS_FOR_VOTING = 2;

/**
 * Correction status enum
 */
export const CorrectionStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

/**
 * Editable fields enum with metadata
 */
export const EditableFields = {
  name: {
    id: 'name',
    label: 'Nom du spot',
    icon: 'fa-tag',
    description: 'Le nom du spot (ex: Aire de Beaune)',
    validation: (value) => value && value.length >= 3 && value.length <= 100,
    errorMessage: 'Le nom doit contenir entre 3 et 100 caracteres',
  },
  description: {
    id: 'description',
    label: 'Description',
    icon: 'fa-align-left',
    description: 'Description detaillee du spot',
    validation: (value) => value && value.length >= 10 && value.length <= 1000,
    errorMessage: 'La description doit contenir entre 10 et 1000 caracteres',
  },
  coordinates: {
    id: 'coordinates',
    label: 'Coordonnees',
    icon: 'fa-map-marker-alt',
    description: 'Latitude et longitude du spot',
    validation: (value) => {
      if (!value || typeof value !== 'object') return false;
      const { lat, lng } = value;
      return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
      );
    },
    errorMessage: 'Coordonnees invalides (lat: -90 a 90, lng: -180 a 180)',
  },
  amenities: {
    id: 'amenities',
    label: 'Commodites',
    icon: 'fa-coffee',
    description: 'Services disponibles (wifi, toilettes, eau, abri, etc)',
    validation: (value) => Array.isArray(value) && value.length <= 20,
    errorMessage: 'Les commodites doivent etre une liste (max 20 elements)',
  },
  directions: {
    id: 'directions',
    label: 'Directions',
    icon: 'fa-directions',
    description: 'Comment arriver au spot',
    validation: (value) => value && value.length >= 10 && value.length <= 500,
    errorMessage: 'Les directions doivent contenir entre 10 et 500 caracteres',
  },
};

/**
 * Get corrections from storage
 * @returns {Array} Array of correction objects
 */
function getCorrectionsFromStorage() {
  try {
    const data = Storage.get(CORRECTIONS_STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[SpotCorrections] Error reading corrections:', error);
    return [];
  }
}

/**
 * Save corrections to storage
 * @param {Array} corrections - Array of correction objects
 */
function saveCorrectionsToStorage(corrections) {
  try {
    Storage.set(CORRECTIONS_STORAGE_KEY, corrections);
    setState({ spotCorrections: corrections });
  } catch (error) {
    console.error('[SpotCorrections] Error saving corrections:', error);
  }
}

/**
 * Generate unique correction ID
 * @returns {string} Unique correction ID
 */
function generateCorrectionId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all editable fields
 * @returns {Array} Array of field objects
 */
export function getEditableFields() {
  return Object.values(EditableFields);
}

/**
 * Get a specific editable field by ID
 * @param {string} fieldId - The field ID
 * @returns {Object|null} Field object or null if not found
 */
export function getEditableFieldById(fieldId) {
  if (!fieldId) return null;
  return EditableFields[fieldId] || null;
}

/**
 * Validate a field value
 * @param {string} fieldId - The field ID
 * @param {*} value - The value to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFieldValue(fieldId, value) {
  const field = getEditableFieldById(fieldId);
  if (!field) {
    return { valid: false, error: 'Champ inconnu' };
  }

  if (!field.validation(value)) {
    return { valid: false, error: field.errorMessage };
  }

  return { valid: true };
}

/**
 * Propose a correction for a spot
 * @param {string} spotId - ID of the spot to correct
 * @param {string} field - Field to correct (name, description, coordinates, amenities, directions)
 * @param {*} newValue - The proposed new value
 * @param {string} reason - Reason for the correction
 * @returns {Object} Result object with success status and correction data
 */
export function proposeCorrection(spotId, field, newValue, reason = '') {
  if (!spotId) {
    return { success: false, error: 'spot_id_required' };
  }

  if (!field) {
    return { success: false, error: 'field_required' };
  }

  // Validate field
  const fieldInfo = getEditableFieldById(field);
  if (!fieldInfo) {
    return { success: false, error: 'invalid_field' };
  }

  // Validate value
  const validation = validateFieldValue(field, newValue);
  if (!validation.valid) {
    showToast(validation.error, 'error');
    return { success: false, error: 'invalid_value', message: validation.error };
  }

  if (!reason || reason.trim().length < 5) {
    showToast('La raison doit contenir au moins 5 caracteres', 'warning');
    return { success: false, error: 'reason_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    showToast(t('loginRequired') || 'Connexion requise', 'warning');
    return { success: false, error: 'not_logged_in' };
  }

  const corrections = getCorrectionsFromStorage();

  // Check if user already has a pending correction for this spot and field
  const existingCorrection = corrections.find(
    c => c.spotId === spotId &&
      c.field === field &&
      c.authorId === currentUserId &&
      c.status === CorrectionStatus.PENDING
  );

  if (existingCorrection) {
    showToast('Tu as deja propose une correction pour ce champ', 'warning');
    return { success: false, error: 'already_proposed' };
  }

  // Create correction entry
  const correction = {
    id: generateCorrectionId(),
    spotId,
    field,
    fieldLabel: fieldInfo.label,
    newValue,
    reason: reason.trim(),
    authorId: currentUserId,
    authorName: state.username || 'Voyageur',
    status: CorrectionStatus.PENDING,
    votes: {
      approve: [],
      reject: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CORRECTION_EXPIRY_MS).toISOString(),
  };

  // Add to corrections list
  corrections.push(correction);
  saveCorrectionsToStorage(corrections);

  showToast('Correction proposee ! Elle sera soumise au vote de la communaute.', 'success');

  return { success: true, correction };
}

/**
 * Get pending corrections for a specific spot
 * @param {string} spotId - ID of the spot
 * @returns {Array} Array of pending correction objects
 */
export function getPendingCorrections(spotId) {
  if (!spotId) return [];

  const corrections = getCorrectionsFromStorage();
  const now = new Date();

  return corrections
    .filter(c => {
      if (c.spotId !== spotId) return false;
      if (c.status !== CorrectionStatus.PENDING) return false;
      // Check if expired
      if (new Date(c.expiresAt) < now) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get all pending corrections (for moderation/display)
 * @returns {Array} Array of pending correction objects
 */
export function getAllPendingCorrections() {
  const corrections = getCorrectionsFromStorage();
  const now = new Date();

  return corrections
    .filter(c => {
      if (c.status !== CorrectionStatus.PENDING) return false;
      if (new Date(c.expiresAt) < now) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a specific correction by ID
 * @param {string} correctionId - ID of the correction
 * @returns {Object|null} Correction object or null if not found
 */
export function getCorrectionById(correctionId) {
  if (!correctionId) return null;

  const corrections = getCorrectionsFromStorage();
  return corrections.find(c => c.id === correctionId) || null;
}

/**
 * Approve a correction (via community vote)
 * @param {string} correctionId - ID of the correction to approve
 * @returns {Object} Result object with success status
 */
export function approveCorrection(correctionId) {
  if (!correctionId) {
    return { success: false, error: 'correction_id_required' };
  }

  const corrections = getCorrectionsFromStorage();
  const index = corrections.findIndex(c => c.id === correctionId);

  if (index === -1) {
    return { success: false, error: 'correction_not_found' };
  }

  const correction = corrections[index];

  if (correction.status !== CorrectionStatus.PENDING) {
    return { success: false, error: 'correction_not_pending' };
  }

  // Update status
  corrections[index] = {
    ...correction,
    status: CorrectionStatus.APPROVED,
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  };

  saveCorrectionsToStorage(corrections);

  showToast('Correction approuvee et appliquee !', 'success');

  return { success: true, correction: corrections[index] };
}

/**
 * Reject a correction (via community vote or moderation)
 * @param {string} correctionId - ID of the correction to reject
 * @param {string} reason - Reason for rejection (optional)
 * @returns {Object} Result object with success status
 */
export function rejectCorrection(correctionId, reason = '') {
  if (!correctionId) {
    return { success: false, error: 'correction_id_required' };
  }

  const corrections = getCorrectionsFromStorage();
  const index = corrections.findIndex(c => c.id === correctionId);

  if (index === -1) {
    return { success: false, error: 'correction_not_found' };
  }

  const correction = corrections[index];

  if (correction.status !== CorrectionStatus.PENDING) {
    return { success: false, error: 'correction_not_pending' };
  }

  // Update status
  corrections[index] = {
    ...correction,
    status: CorrectionStatus.REJECTED,
    updatedAt: new Date().toISOString(),
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason.trim(),
  };

  saveCorrectionsToStorage(corrections);

  showToast('Correction rejetee.', 'info');

  return { success: true };
}

/**
 * Get corrections made by the current user
 * @returns {Array} Array of correction objects
 */
export function getMyCorrections() {
  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) return [];

  const corrections = getCorrectionsFromStorage();

  return corrections
    .filter(c => c.authorId === currentUserId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Vote on a correction
 * @param {string} correctionId - ID of the correction
 * @param {string} voteType - 'approve' or 'reject'
 * @returns {Object} Result object with success status
 */
export function voteOnCorrection(correctionId, voteType) {
  if (!correctionId) {
    return { success: false, error: 'correction_id_required' };
  }

  if (voteType !== 'approve' && voteType !== 'reject') {
    return { success: false, error: 'invalid_vote_type' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    showToast(t('loginRequired') || 'Connexion requise', 'warning');
    return { success: false, error: 'not_logged_in' };
  }

  const corrections = getCorrectionsFromStorage();
  const index = corrections.findIndex(c => c.id === correctionId);

  if (index === -1) {
    return { success: false, error: 'correction_not_found' };
  }

  const correction = corrections[index];

  // Cannot vote on own correction
  if (correction.authorId === currentUserId) {
    showToast('Tu ne peux pas voter sur ta propre correction', 'warning');
    return { success: false, error: 'cannot_vote_own' };
  }

  // Check if correction is still pending
  if (correction.status !== CorrectionStatus.PENDING) {
    showToast('Cette correction n\'est plus en attente de votes', 'info');
    return { success: false, error: 'correction_not_pending' };
  }

  // Check if expired
  if (new Date(correction.expiresAt) < new Date()) {
    showToast('Cette correction a expire', 'info');
    return { success: false, error: 'correction_expired' };
  }

  // Check if already voted
  const hasApproved = correction.votes.approve.includes(currentUserId);
  const hasRejected = correction.votes.reject.includes(currentUserId);

  if (hasApproved || hasRejected) {
    showToast('Tu as deja vote sur cette correction', 'warning');
    return { success: false, error: 'already_voted' };
  }

  // Add vote
  correction.votes[voteType].push(currentUserId);
  correction.updatedAt = new Date().toISOString();

  // Check if thresholds reached
  let statusChanged = false;
  if (correction.votes.approve.length >= VOTES_REQUIRED_TO_APPROVE) {
    correction.status = CorrectionStatus.APPROVED;
    correction.approvedAt = new Date().toISOString();
    statusChanged = true;
    showToast('Correction approuvee par la communaute !', 'success');
  } else if (correction.votes.reject.length >= VOTES_REQUIRED_TO_REJECT) {
    correction.status = CorrectionStatus.REJECTED;
    correction.rejectedAt = new Date().toISOString();
    statusChanged = true;
    showToast('Correction rejetee par la communaute', 'info');
  } else {
    showToast(`Vote enregistre ! (+${POINTS_FOR_VOTING} points)`, 'success');
  }

  corrections[index] = correction;
  saveCorrectionsToStorage(corrections);

  return {
    success: true,
    statusChanged,
    newStatus: correction.status,
    approveVotes: correction.votes.approve.length,
    rejectVotes: correction.votes.reject.length,
  };
}

/**
 * Check if current user has voted on a correction
 * @param {string} correctionId - ID of the correction
 * @returns {Object} { hasVoted: boolean, voteType: 'approve'|'reject'|null }
 */
export function hasVotedOnCorrection(correctionId) {
  if (!correctionId) return { hasVoted: false, voteType: null };

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) return { hasVoted: false, voteType: null };

  const correction = getCorrectionById(correctionId);
  if (!correction) return { hasVoted: false, voteType: null };

  if (correction.votes.approve.includes(currentUserId)) {
    return { hasVoted: true, voteType: 'approve' };
  }
  if (correction.votes.reject.includes(currentUserId)) {
    return { hasVoted: true, voteType: 'reject' };
  }

  return { hasVoted: false, voteType: null };
}

/**
 * Cancel a pending correction (only by author)
 * @param {string} correctionId - ID of the correction to cancel
 * @returns {Object} Result object with success status
 */
export function cancelCorrection(correctionId) {
  if (!correctionId) {
    return { success: false, error: 'correction_id_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    return { success: false, error: 'not_logged_in' };
  }

  const corrections = getCorrectionsFromStorage();
  const index = corrections.findIndex(c => c.id === correctionId);

  if (index === -1) {
    return { success: false, error: 'correction_not_found' };
  }

  const correction = corrections[index];

  // Only author can cancel
  if (correction.authorId !== currentUserId) {
    showToast('Tu ne peux annuler que tes propres corrections', 'warning');
    return { success: false, error: 'not_author' };
  }

  // Can only cancel pending corrections
  if (correction.status !== CorrectionStatus.PENDING) {
    showToast('Seules les corrections en attente peuvent etre annulees', 'warning');
    return { success: false, error: 'correction_not_pending' };
  }

  // Remove from list
  corrections.splice(index, 1);
  saveCorrectionsToStorage(corrections);

  showToast('Correction annulee', 'success');

  return { success: true };
}

/**
 * Process expired corrections
 * @returns {number} Number of corrections marked as expired
 */
export function processExpiredCorrections() {
  const corrections = getCorrectionsFromStorage();
  const now = new Date();
  let expiredCount = 0;

  corrections.forEach((correction, index) => {
    if (
      correction.status === CorrectionStatus.PENDING &&
      new Date(correction.expiresAt) < now
    ) {
      corrections[index] = {
        ...correction,
        status: CorrectionStatus.EXPIRED,
        updatedAt: now.toISOString(),
      };
      expiredCount++;
    }
  });

  if (expiredCount > 0) {
    saveCorrectionsToStorage(corrections);
  }

  return expiredCount;
}

/**
 * Get correction statistics
 * @returns {Object} Statistics object
 */
export function getCorrectionStats() {
  const corrections = getCorrectionsFromStorage();
  const state = getState();
  const currentUserId = state.user?.uid;

  const stats = {
    total: corrections.length,
    pending: corrections.filter(c => c.status === CorrectionStatus.PENDING).length,
    approved: corrections.filter(c => c.status === CorrectionStatus.APPROVED).length,
    rejected: corrections.filter(c => c.status === CorrectionStatus.REJECTED).length,
    expired: corrections.filter(c => c.status === CorrectionStatus.EXPIRED).length,
    byField: {},
    myCorrections: 0,
    myApproved: 0,
    myVotes: 0,
  };

  // Count by field
  Object.keys(EditableFields).forEach(field => {
    stats.byField[field] = corrections.filter(c => c.field === field).length;
  });

  // User-specific stats
  if (currentUserId) {
    stats.myCorrections = corrections.filter(c => c.authorId === currentUserId).length;
    stats.myApproved = corrections.filter(
      c => c.authorId === currentUserId && c.status === CorrectionStatus.APPROVED
    ).length;

    // Count user's votes
    corrections.forEach(c => {
      if (c.votes.approve.includes(currentUserId) || c.votes.reject.includes(currentUserId)) {
        stats.myVotes++;
      }
    });
  }

  return stats;
}

/**
 * Get corrections for a spot by field
 * @param {string} spotId - ID of the spot
 * @param {string} field - Field to filter by (optional)
 * @returns {Array} Array of correction objects
 */
export function getCorrectionsByField(spotId, field = null) {
  const corrections = getCorrectionsFromStorage();

  return corrections.filter(c => {
    if (c.spotId !== spotId) return false;
    if (field && c.field !== field) return false;
    return true;
  });
}

/**
 * Get history of approved corrections for a spot
 * @param {string} spotId - ID of the spot
 * @returns {Array} Array of approved correction objects
 */
export function getApprovedCorrectionsHistory(spotId) {
  if (!spotId) return [];

  const corrections = getCorrectionsFromStorage();

  return corrections
    .filter(c => c.spotId === spotId && c.status === CorrectionStatus.APPROVED)
    .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
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
    });
  } catch {
    return '';
  }
}

/**
 * Get status label for display
 * @param {string} status - Correction status
 * @returns {string} Status label
 */
export function getStatusLabel(status) {
  const labels = {
    [CorrectionStatus.PENDING]: 'En attente',
    [CorrectionStatus.APPROVED]: 'Approuvee',
    [CorrectionStatus.REJECTED]: 'Rejetee',
    [CorrectionStatus.EXPIRED]: 'Expiree',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 * @param {string} status - Correction status
 * @returns {string} CSS color class
 */
function getStatusColor(status) {
  const colors = {
    [CorrectionStatus.PENDING]: 'text-yellow-400 bg-yellow-500/20',
    [CorrectionStatus.APPROVED]: 'text-green-400 bg-green-500/20',
    [CorrectionStatus.REJECTED]: 'text-red-400 bg-red-500/20',
    [CorrectionStatus.EXPIRED]: 'text-slate-400 bg-slate-500/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Render a correction card HTML
 * @param {Object} correction - Correction object
 * @returns {string} HTML string of correction card
 */
export function renderCorrectionCard(correction) {
  if (!correction) return '';

  const state = getState();
  const currentUserId = state.user?.uid;
  const isAuthor = correction.authorId === currentUserId;
  const voteInfo = hasVotedOnCorrection(correction.id);
  const field = getEditableFieldById(correction.field);
  const isPending = correction.status === CorrectionStatus.PENDING;

  // Format value for display
  let displayValue = correction.newValue;
  if (correction.field === 'coordinates' && typeof correction.newValue === 'object') {
    displayValue = `${correction.newValue.lat}, ${correction.newValue.lng}`;
  } else if (correction.field === 'amenities' && Array.isArray(correction.newValue)) {
    displayValue = correction.newValue.join(', ');
  }

  return `
    <div
      class="correction-card p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-correction-id="${escapeHTML(correction.id)}"
      role="article"
      aria-labelledby="correction-title-${escapeHTML(correction.id)}"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <!-- Header -->
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(correction.status)}">
              ${escapeHTML(getStatusLabel(correction.status))}
            </span>
            <span class="text-slate-500 text-xs">${escapeHTML(formatDate(correction.createdAt))}</span>
          </div>

          <!-- Field and value -->
          <div class="mb-2">
            <div class="flex items-center gap-2 text-white mb-1" id="correction-title-${escapeHTML(correction.id)}">
              <i class="fas ${escapeHTML(field?.icon || 'fa-edit')} text-primary-400"></i>
              <span class="font-medium">${escapeHTML(field?.label || correction.field)}</span>
            </div>
            <p class="text-sm text-slate-300 bg-white/5 rounded px-2 py-1">
              ${escapeHTML(String(displayValue))}
            </p>
          </div>

          <!-- Reason -->
          <p class="text-sm text-slate-400 mb-2">
            <i class="fas fa-comment-dots mr-1"></i>
            ${escapeHTML(correction.reason)}
          </p>

          <!-- Author -->
          <p class="text-xs text-slate-500">
            Propose par <span class="text-white">${escapeHTML(correction.authorName)}</span>
          </p>

          <!-- Votes -->
          ${isPending ? `
            <div class="flex items-center gap-4 mt-3">
              <div class="flex items-center gap-1 text-green-400">
                <i class="fas fa-thumbs-up"></i>
                <span>${correction.votes.approve.length}/${VOTES_REQUIRED_TO_APPROVE}</span>
              </div>
              <div class="flex items-center gap-1 text-red-400">
                <i class="fas fa-thumbs-down"></i>
                <span>${correction.votes.reject.length}/${VOTES_REQUIRED_TO_REJECT}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2">
          ${isPending && !isAuthor && !voteInfo.hasVoted && currentUserId ? `
            <button
              onclick="voteOnCorrectionHandler('${escapeHTML(correction.id)}', 'approve')"
              class="btn btn-sm bg-green-500/20 hover:bg-green-500/30 text-green-400"
              aria-label="Approuver cette correction"
            >
              <i class="fas fa-thumbs-up"></i>
            </button>
            <button
              onclick="voteOnCorrectionHandler('${escapeHTML(correction.id)}', 'reject')"
              class="btn btn-sm bg-red-500/20 hover:bg-red-500/30 text-red-400"
              aria-label="Rejeter cette correction"
            >
              <i class="fas fa-thumbs-down"></i>
            </button>
          ` : ''}
          ${isPending && isAuthor ? `
            <button
              onclick="cancelCorrectionHandler('${escapeHTML(correction.id)}')"
              class="btn btn-sm bg-slate-500/20 hover:bg-slate-500/30 text-slate-400"
              aria-label="Annuler cette correction"
            >
              <i class="fas fa-times mr-1"></i>
              Annuler
            </button>
          ` : ''}
          ${voteInfo.hasVoted ? `
            <span class="text-xs text-slate-500">
              <i class="fas fa-check mr-1"></i>
              Vote ${voteInfo.voteType === 'approve' ? 'pour' : 'contre'}
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render corrections list for a spot
 * @param {string} spotId - ID of the spot
 * @returns {string} HTML string of corrections list
 */
export function renderCorrectionsListForSpot(spotId) {
  const corrections = getPendingCorrections(spotId);

  if (corrections.length === 0) {
    return `
      <div class="empty-state p-6 text-center" role="status">
        <div class="text-4xl mb-3">✅</div>
        <h3 class="text-lg font-semibold text-white mb-1">Aucune correction en attente</h3>
        <p class="text-slate-400 text-sm">Les informations de ce spot semblent correctes</p>
      </div>
    `;
  }

  return `
    <div class="corrections-list space-y-3" role="list" aria-label="Corrections en attente">
      <h3 class="text-lg font-semibold text-white mb-4">
        <i class="fas fa-edit mr-2 text-primary-400"></i>
        Corrections proposees
        <span class="text-sm font-normal text-slate-400 ml-2">(${corrections.length})</span>
      </h3>
      ${corrections.map(c => renderCorrectionCard(c)).join('')}
    </div>
  `;
}

/**
 * Render my corrections list
 * @returns {string} HTML string of my corrections list
 */
export function renderMyCorrections() {
  const corrections = getMyCorrections();

  if (corrections.length === 0) {
    return `
      <div class="empty-state p-6 text-center" role="status">
        <div class="text-4xl mb-3">📝</div>
        <h3 class="text-lg font-semibold text-white mb-1">Aucune correction</h3>
        <p class="text-slate-400 text-sm">Tu n'as pas encore propose de corrections</p>
      </div>
    `;
  }

  return `
    <div class="my-corrections-list space-y-3" role="list" aria-label="Mes corrections">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">
          <i class="fas fa-edit mr-2 text-primary-400"></i>
          Mes corrections
          <span class="text-sm font-normal text-slate-400 ml-2">(${corrections.length})</span>
        </h3>
      </div>
      ${corrections.map(c => renderCorrectionCard(c)).join('')}
    </div>
  `;
}

/**
 * Render correction proposal form HTML
 * @param {string} spotId - ID of the spot
 * @returns {string} HTML string of proposal form
 */
export function renderCorrectionForm(spotId) {
  if (!spotId) return '';

  const fields = getEditableFields();

  return `
    <div class="correction-form bg-white/5 rounded-xl p-6" role="form" aria-label="Proposer une correction">
      <h3 class="text-lg font-semibold text-white mb-4">
        <i class="fas fa-edit mr-2 text-primary-400"></i>
        Proposer une correction
      </h3>

      <!-- Field selection -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2" for="correction-field">
          Champ a corriger *
        </label>
        <select
          id="correction-field"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
          onchange="updateCorrectionFieldInfo()"
        >
          <option value="">-- Selectionner un champ --</option>
          ${fields.map(f => `
            <option value="${escapeHTML(f.id)}">
              ${escapeHTML(f.label)}
            </option>
          `).join('')}
        </select>
        <p id="correction-field-description" class="text-xs text-slate-500 mt-1"></p>
      </div>

      <!-- New value -->
      <div class="mb-4" id="correction-value-container">
        <label class="block text-sm text-slate-400 mb-2" for="correction-value">
          Nouvelle valeur *
        </label>
        <input
          type="text"
          id="correction-value"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
          placeholder="Entrer la nouvelle valeur"
        />
      </div>

      <!-- Reason -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2" for="correction-reason">
          Raison de la correction *
        </label>
        <textarea
          id="correction-reason"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white resize-none"
          rows="3"
          maxlength="300"
          placeholder="Explique pourquoi cette correction est necessaire..."
        ></textarea>
        <p class="text-xs text-slate-500 mt-1">
          <span id="correction-reason-count">0</span>/300 caracteres
        </p>
      </div>

      <!-- Submit -->
      <button
        onclick="submitCorrectionHandler('${escapeHTML(spotId)}')"
        class="btn w-full bg-primary-500 hover:bg-primary-600 text-white"
      >
        <i class="fas fa-paper-plane mr-2"></i>
        Soumettre la correction
      </button>
    </div>
  `;
}

/**
 * Clear all corrections (for testing)
 * @returns {Object} Result object with success status
 */
export function clearAllCorrections() {
  saveCorrectionsToStorage([]);
  return { success: true };
}

// Global handlers for onclick events
window.voteOnCorrectionHandler = (correctionId, voteType) => {
  voteOnCorrection(correctionId, voteType);
  setState({ refreshCorrections: Date.now() });
};

window.cancelCorrectionHandler = (correctionId) => {
  cancelCorrection(correctionId);
  setState({ refreshCorrections: Date.now() });
};

window.submitCorrectionHandler = (spotId) => {
  const fieldSelect = document.getElementById('correction-field');
  const valueInput = document.getElementById('correction-value');
  const reasonTextarea = document.getElementById('correction-reason');

  const field = fieldSelect?.value;
  let value = valueInput?.value?.trim();
  const reason = reasonTextarea?.value?.trim();

  // Handle special field types
  if (field === 'coordinates') {
    // Parse coordinates from "lat, lng" format
    const parts = value.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      value = { lat: parts[0], lng: parts[1] };
    }
  } else if (field === 'amenities') {
    // Parse amenities from comma-separated
    value = value.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }

  const result = proposeCorrection(spotId, field, value, reason);
  if (result.success) {
    // Clear form
    if (fieldSelect) fieldSelect.value = '';
    if (valueInput) valueInput.value = '';
    if (reasonTextarea) reasonTextarea.value = '';
    setState({ refreshCorrections: Date.now() });
  }
};

window.updateCorrectionFieldInfo = () => {
  const fieldSelect = document.getElementById('correction-field');
  const descriptionEl = document.getElementById('correction-field-description');
  const valueInput = document.getElementById('correction-value');

  const field = getEditableFieldById(fieldSelect?.value);
  if (descriptionEl) {
    descriptionEl.textContent = field?.description || '';
  }

  // Update placeholder based on field type
  if (valueInput && field) {
    if (field.id === 'coordinates') {
      valueInput.placeholder = '48.8566, 2.3522';
    } else if (field.id === 'amenities') {
      valueInput.placeholder = 'wifi, toilettes, eau, abri';
    } else {
      valueInput.placeholder = field.description || 'Entrer la nouvelle valeur';
    }
  }
};

window.updateCorrectionReasonCount = () => {
  const textarea = document.getElementById('correction-reason');
  const counter = document.getElementById('correction-reason-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
};

// Export default with all functions
export default {
  // Constants
  VOTES_REQUIRED_TO_APPROVE,
  VOTES_REQUIRED_TO_REJECT,
  CORRECTION_EXPIRY_DAYS,
  CORRECTION_EXPIRY_MS,
  POINTS_FOR_APPROVED_CORRECTION,
  POINTS_FOR_VOTING,
  CorrectionStatus,
  EditableFields,
  // Field functions
  getEditableFields,
  getEditableFieldById,
  validateFieldValue,
  // Core functions
  proposeCorrection,
  getPendingCorrections,
  getAllPendingCorrections,
  getCorrectionById,
  approveCorrection,
  rejectCorrection,
  getMyCorrections,
  // Voting
  voteOnCorrection,
  hasVotedOnCorrection,
  // Other actions
  cancelCorrection,
  processExpiredCorrections,
  // Stats and queries
  getCorrectionStats,
  getCorrectionsByField,
  getApprovedCorrectionsHistory,
  getStatusLabel,
  // Render functions
  renderCorrectionCard,
  renderCorrectionsListForSpot,
  renderMyCorrections,
  renderCorrectionForm,
  // Testing
  clearAllCorrections,
};
