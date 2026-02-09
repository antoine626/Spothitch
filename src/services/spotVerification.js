/**
 * Spot Verification Service
 * Feature #82 - Badge spot verifie
 *
 * Permet aux utilisateurs de niveau 15+ de verifier des spots.
 * Limite : 1 verification par utilisateur par semaine.
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Storage key for verification history
const VERIFICATION_STORAGE_KEY = 'spothitch_spot_verifications';

// Constants
export const MIN_LEVEL_TO_VERIFY = 15;
export const MIN_LEVEL_TRUSTED = 15;
export const MIN_LEVEL_EXPERT = 25;
export const VERIFICATION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const VERIFICATION_COOLDOWN_DAYS = 7;
export const POINTS_FOR_VERIFICATION = 25;
export const VERIFIED_BADGE_THRESHOLD = 3; // validations de confiance nécessaires
export const VERIFIED_BADGE_EXPIRATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 mois

/**
 * Verification status enum
 */
export const VerificationStatus = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

/**
 * Get stored verifications from localStorage
 * @returns {Object} Verification data
 */
export function getStoredVerifications() {
  try {
    const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { verifications: [], userVerifications: {} };
  } catch (e) {
    console.warn('[SpotVerification] Failed to load verifications:', e);
    return { verifications: [], userVerifications: {} };
  }
}

/**
 * Save verifications to localStorage
 * @param {Object} data - Verification data to save
 */
function saveVerifications(data) {
  try {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[SpotVerification] Failed to save verifications:', e);
  }
}

/**
 * Check if user can verify spots (level 15+)
 * @param {number} level - User level (optional, uses state if not provided)
 * @returns {boolean} True if user can verify
 */
export function canUserVerify(level = null) {
  const state = getState();
  const userLevel = level !== null ? level : (state.level || 1);
  return userLevel >= MIN_LEVEL_TO_VERIFY;
}

/**
 * Get user trust level based on their level
 * @param {number} userLevel - User level
 * @returns {string} Trust level: 'standard', 'trusted', or 'expert'
 */
export function getUserTrustLevel(userLevel) {
  if (userLevel >= MIN_LEVEL_EXPERT) {
    return 'expert';
  }
  if (userLevel >= MIN_LEVEL_TRUSTED) {
    return 'trusted';
  }
  return 'standard';
}

/**
 * Get validation weight based on user level
 * @param {number} userLevel - User level
 * @returns {number} Validation weight (1 or 2)
 */
export function getValidationWeight(userLevel) {
  if (userLevel >= MIN_LEVEL_TRUSTED) {
    return 2; // Trusted users (level 15+) count double
  }
  return 1; // Standard users (level 1-14) count single
}

/**
 * Check if user can report obsolete/dangerous spots
 * @param {number} userLevel - User level
 * @returns {boolean} True if user can report
 */
export function canReportObsolete(userLevel) {
  return userLevel >= MIN_LEVEL_EXPERT;
}

/**
 * Get user's last verification timestamp
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {number|null} Timestamp of last verification or null
 */
export function getLastVerificationTime(userId = null) {
  const state = getState();
  const uid = userId || state.user?.uid;
  if (!uid) return null;

  const data = getStoredVerifications();
  return data.userVerifications[uid]?.lastVerificationAt || null;
}

/**
 * Check if user is in cooldown period
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {boolean} True if user is in cooldown
 */
export function isInCooldown(userId = null) {
  const lastVerification = getLastVerificationTime(userId);
  if (!lastVerification) return false;

  const now = Date.now();
  return (now - lastVerification) < VERIFICATION_COOLDOWN_MS;
}

/**
 * Get remaining cooldown time in milliseconds
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {number} Remaining time in ms (0 if not in cooldown)
 */
export function getRemainingCooldownMs(userId = null) {
  const lastVerification = getLastVerificationTime(userId);
  if (!lastVerification) return 0;

  const now = Date.now();
  const elapsed = now - lastVerification;
  const remaining = VERIFICATION_COOLDOWN_MS - elapsed;

  return Math.max(0, remaining);
}

/**
 * Get remaining cooldown time formatted
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Object} Object with days, hours, minutes remaining
 */
export function getRemainingCooldown(userId = null) {
  const remainingMs = getRemainingCooldownMs(userId);

  if (remainingMs === 0) {
    return { days: 0, hours: 0, minutes: 0, total: 0 };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes, total: remainingMs };
}

/**
 * Check if user can verify right now (level + cooldown)
 * @param {string} userId - User ID (optional)
 * @returns {Object} { canVerify: boolean, reason: string|null }
 */
export function canVerifyNow(userId = null) {
  const state = getState();

  // Check if logged in
  if (!state.user?.uid) {
    return { canVerify: false, reason: 'not_logged_in' };
  }

  // Check level
  if (!canUserVerify()) {
    return {
      canVerify: false,
      reason: 'level_too_low',
      requiredLevel: MIN_LEVEL_TO_VERIFY,
      currentLevel: state.level || 1,
    };
  }

  // Check cooldown
  if (isInCooldown(userId)) {
    const remaining = getRemainingCooldown(userId);
    return {
      canVerify: false,
      reason: 'in_cooldown',
      remainingTime: remaining,
    };
  }

  return { canVerify: true, reason: null };
}

/**
 * Check if a spot is already verified (has badge and not expired)
 * @param {string|number} spotId - Spot ID
 * @returns {boolean} True if spot is verified
 */
export function isSpotVerified(spotId) {
  // Check if spot has enough trusted validations
  const hasBadge = checkVerifiedBadge(spotId);

  if (!hasBadge) {
    return false;
  }

  // Check if badge is expired
  const isExpired = checkBadgeExpiration(spotId);

  return !isExpired;
}

/**
 * Get verification info for a spot
 * @param {string|number} spotId - Spot ID
 * @returns {Object|null} Verification info or null
 */
export function getSpotVerification(spotId) {
  const data = getStoredVerifications();
  return data.verifications.find(v => v.spotId === String(spotId)) || null;
}

/**
 * Get all verified spots
 * @returns {Array} Array of verified spot verifications
 */
export function getVerifiedSpots() {
  const data = getStoredVerifications();
  return data.verifications.filter(v => v.status === VerificationStatus.VERIFIED);
}

/**
 * Get all validations for a specific spot
 * @param {string|number} spotId - Spot ID
 * @returns {Array} Array of validations for this spot
 */
export function getSpotValidations(spotId) {
  const data = getStoredVerifications();
  const spotIdStr = String(spotId);
  return data.verifications.filter(v =>
    v.spotId === spotIdStr && v.status === VerificationStatus.VERIFIED
  );
}

/**
 * Calculate total validation weight for a spot
 * @param {string|number} spotId - Spot ID
 * @returns {number} Total validation weight
 */
export function calculateSpotValidationWeight(spotId) {
  const validations = getSpotValidations(spotId);
  return validations.reduce((total, validation) => {
    const weight = getValidationWeight(validation.verifierLevel);
    return total + weight;
  }, 0);
}

/**
 * Check if spot should have verified badge
 * @param {string|number} spotId - Spot ID
 * @returns {boolean} True if spot should have verified badge
 */
export function checkVerifiedBadge(spotId) {
  const validations = getSpotValidations(spotId);

  // Count trusted validations (level 15+)
  const trustedValidations = validations.filter(v =>
    v.verifierLevel >= MIN_LEVEL_TRUSTED
  );

  // Need at least 3 trusted validations
  return trustedValidations.length >= VERIFIED_BADGE_THRESHOLD;
}

/**
 * Check if verified badge has expired (no validations in last 6 months)
 * @param {string|number} spotId - Spot ID
 * @returns {boolean} True if badge should be expired
 */
export function checkBadgeExpiration(spotId) {
  const validations = getSpotValidations(spotId);

  if (validations.length === 0) {
    return true; // No validations = expired
  }

  // Find most recent validation
  const mostRecent = validations.reduce((latest, current) => {
    const currentTime = new Date(current.verifiedAt).getTime();
    const latestTime = latest ? new Date(latest.verifiedAt).getTime() : 0;
    return currentTime > latestTime ? current : latest;
  }, null);

  if (!mostRecent) {
    return true;
  }

  const now = Date.now();
  const lastValidationTime = new Date(mostRecent.verifiedAt).getTime();
  const timeSinceLastValidation = now - lastValidationTime;

  return timeSinceLastValidation > VERIFIED_BADGE_EXPIRATION_MS;
}

/**
 * Get verifications by user
 * @param {string} userId - User ID
 * @returns {Array} Array of verifications by this user
 */
export function getVerificationsByUser(userId) {
  const data = getStoredVerifications();
  return data.verifications.filter(v => v.verifierId === userId);
}

/**
 * Get user's verification count
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {number} Number of verifications by user
 */
export function getUserVerificationCount(userId = null) {
  const state = getState();
  const uid = userId || state.user?.uid;
  if (!uid) return 0;

  return getVerificationsByUser(uid).length;
}

/**
 * Verify a spot
 * @param {string|number} spotId - Spot ID to verify
 * @param {string} spotName - Spot name for display
 * @param {string} comment - Optional verification comment
 * @returns {Object} Result { success: boolean, error?: string, verification?: Object }
 */
export function verifySpot(spotId, spotName = '', comment = '') {
  const state = getState();
  const spotIdStr = String(spotId);

  // Check if logged in
  if (!state.user?.uid) {
    return { success: false, error: 'not_logged_in' };
  }

  // Check level
  if (!canUserVerify()) {
    showToast(`Niveau ${MIN_LEVEL_TO_VERIFY} requis pour verifier les spots`, 'warning');
    return {
      success: false,
      error: 'level_too_low',
      requiredLevel: MIN_LEVEL_TO_VERIFY,
      currentLevel: state.level || 1,
    };
  }

  // Check cooldown
  if (isInCooldown()) {
    const remaining = getRemainingCooldown();
    const message = remaining.days > 0
      ? `Attends encore ${remaining.days}j ${remaining.hours}h`
      : `Attends encore ${remaining.hours}h ${remaining.minutes}min`;
    showToast(message, 'warning');
    return {
      success: false,
      error: 'in_cooldown',
      remainingTime: remaining,
    };
  }

  // Check if spot already verified
  if (isSpotVerified(spotIdStr)) {
    showToast('Ce spot est deja verifie !', 'info');
    return { success: false, error: 'already_verified' };
  }

  // Check if user already validated this spot
  const data = getStoredVerifications();
  const existingValidation = data.verifications.find(
    v => v.spotId === spotIdStr && v.verifierId === state.user.uid
  );

  if (existingValidation) {
    showToast('Tu as deja valide ce spot !', 'info');
    return { success: false, error: 'already_validated_by_user' };
  }

  const now = Date.now();
  const userLevel = state.level || 1;
  const trustLevel = getUserTrustLevel(userLevel);
  const weight = getValidationWeight(userLevel);

  const verification = {
    id: `verif_${now}_${Math.random().toString(36).substring(2, 9)}`,
    spotId: spotIdStr,
    spotName: spotName,
    verifierId: state.user.uid,
    verifierName: state.username || 'Voyageur',
    verifierLevel: userLevel,
    trustLevel: trustLevel,
    validationWeight: weight,
    status: VerificationStatus.VERIFIED,
    comment: comment,
    verifiedAt: new Date().toISOString(),
    timestamp: now,
  };

  // Add to verifications list
  data.verifications.push(verification);

  // Update user's verification record
  if (!data.userVerifications[state.user.uid]) {
    data.userVerifications[state.user.uid] = {
      totalVerifications: 0,
      lastVerificationAt: null,
    };
  }
  data.userVerifications[state.user.uid].totalVerifications++;
  data.userVerifications[state.user.uid].lastVerificationAt = now;

  // Save
  saveVerifications(data);

  // Update state for verified spots count
  const verifiedSpotsCount = (state.verifiedSpots || 0) + 1;
  setState({ verifiedSpots: verifiedSpotsCount });

  // Show success toast with weight info
  const weightInfo = weight > 1 ? ` (validation x${weight})` : '';
  showToast(`Spot "${spotName || 'spot'}" valide${weightInfo} ! +${POINTS_FOR_VERIFICATION} pts`, 'success');

  // Check if spot now has verified badge
  const hasBadge = checkVerifiedBadge(spotIdStr);

  return { success: true, verification, hasBadge };
}

/**
 * Revoke a verification (admin/moderator function)
 * @param {string} verificationId - Verification ID to revoke
 * @param {string} reason - Reason for revocation
 * @returns {Object} Result { success: boolean, error?: string }
 */
export function revokeVerification(verificationId, reason = '') {
  const data = getStoredVerifications();
  const index = data.verifications.findIndex(v => v.id === verificationId);

  if (index === -1) {
    return { success: false, error: 'verification_not_found' };
  }

  const verification = data.verifications[index];

  // Update status
  data.verifications[index] = {
    ...verification,
    status: VerificationStatus.REJECTED,
    revokedAt: new Date().toISOString(),
    revocationReason: reason,
  };

  saveVerifications(data);

  return { success: true };
}

/**
 * Get verification statistics
 * @returns {Object} Stats object
 */
export function getVerificationStats() {
  const data = getStoredVerifications();
  const state = getState();

  const verified = data.verifications.filter(v => v.status === VerificationStatus.VERIFIED);
  const userVerifications = state.user?.uid
    ? getVerificationsByUser(state.user.uid)
    : [];

  return {
    totalVerified: verified.length,
    userVerifications: userVerifications.length,
    canVerify: canVerifyNow().canVerify,
    level: state.level || 1,
    minLevel: MIN_LEVEL_TO_VERIFY,
    cooldownDays: VERIFICATION_COOLDOWN_DAYS,
    pointsPerVerification: POINTS_FOR_VERIFICATION,
  };
}

/**
 * Render verification badge HTML
 * @param {string|number} spotId - Spot ID
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string} HTML string for the badge
 */
export function renderVerificationBadge(spotId, size = 'md') {
  // Check if spot has verified badge (and not expired)
  if (!isSpotVerified(spotId)) {
    return '';
  }

  const validations = getSpotValidations(spotId);
  if (validations.length === 0) {
    return '';
  }

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const sizeClass = sizes[size] || sizes.md;

  // Count trusted validations
  const trustedCount = validations.filter(v => v.verifierLevel >= MIN_LEVEL_TRUSTED).length;
  const totalWeight = calculateSpotValidationWeight(spotId);

  return `
    <span class="verified-badge inline-flex items-center gap-1 ${sizeClass} bg-green-500 text-white rounded-full font-medium"
          title="Badge verifie (${trustedCount} validations de confiance, poids total: ${totalWeight})"
          aria-label="Spot verifie">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span>Verifie</span>
    </span>
  `.trim();
}

/**
 * Render verification button HTML
 * @param {string|number} spotId - Spot ID
 * @param {string} spotName - Spot name
 * @returns {string} HTML string for the button
 */
export function renderVerificationButton(spotId, spotName = '') {
  const state = getState();
  const spotIdStr = String(spotId);

  // Check if current user already validated this spot
  const data = getStoredVerifications();
  const userValidated = state.user?.uid && data.verifications.some(
    v => v.spotId === spotIdStr && v.verifierId === state.user.uid
  );

  if (userValidated) {
    return `
      <button class="verify-btn verified flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-default"
              disabled
              aria-label="Deja valide par vous">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <span>Deja valide</span>
      </button>
    `.trim();
  }

  // Show verified badge status if applicable
  const hasBadge = isSpotVerified(spotIdStr);
  if (hasBadge && !userValidated) {
    // Spot has badge but user can still add their validation
  }

  // Check if user can verify
  const checkResult = canVerifyNow();

  if (!checkResult.canVerify) {
    let buttonText = 'Verifier ce spot';
    let disabledReason = '';

    if (checkResult.reason === 'level_too_low') {
      buttonText = `Niveau ${MIN_LEVEL_TO_VERIFY} requis`;
      disabledReason = `Vous etes niveau ${state.level || 1}. Atteignez le niveau ${MIN_LEVEL_TO_VERIFY} pour verifier des spots.`;
    } else if (checkResult.reason === 'in_cooldown') {
      const r = checkResult.remainingTime;
      buttonText = r.days > 0 ? `Attendre ${r.days}j ${r.hours}h` : `Attendre ${r.hours}h ${r.minutes}min`;
      disabledReason = 'Vous pouvez verifier un spot par semaine.';
    } else if (checkResult.reason === 'not_logged_in') {
      buttonText = 'Connectez-vous';
      disabledReason = 'Connectez-vous pour verifier des spots.';
    }

    return `
      <button class="verify-btn disabled flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
              disabled
              title="${disabledReason}"
              aria-label="${buttonText}">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>${buttonText}</span>
      </button>
    `.trim();
  }

  // Can verify - show active button
  return `
    <button class="verify-btn active flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            onclick="window.verifySpot('${spotIdStr}', '${spotName.replace(/'/g, "\\'")}')"
            aria-label="Verifier ce spot">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Verifier ce spot</span>
    </button>
  `.trim();
}

/**
 * Render cooldown info HTML
 * @returns {string} HTML string for cooldown info
 */
export function renderCooldownInfo() {
  const remaining = getRemainingCooldown();

  if (remaining.total === 0) {
    return `
      <div class="cooldown-info flex items-center gap-2 text-green-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <span>Pret a verifier un spot !</span>
      </div>
    `.trim();
  }

  const timeText = remaining.days > 0
    ? `${remaining.days}j ${remaining.hours}h ${remaining.minutes}min`
    : `${remaining.hours}h ${remaining.minutes}min`;

  return `
    <div class="cooldown-info flex items-center gap-2 text-gray-500">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Prochaine verification dans ${timeText}</span>
    </div>
  `.trim();
}

/**
 * Format verification date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
export function formatVerificationDate(isoDate) {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Clear all verifications (for testing/admin)
 */
export function clearAllVerifications() {
  localStorage.removeItem(VERIFICATION_STORAGE_KEY);
  console.log('[SpotVerification] All verifications cleared');
}

// Export default object
export default {
  // Constants
  MIN_LEVEL_TO_VERIFY,
  MIN_LEVEL_TRUSTED,
  MIN_LEVEL_EXPERT,
  VERIFICATION_COOLDOWN_MS,
  VERIFICATION_COOLDOWN_DAYS,
  POINTS_FOR_VERIFICATION,
  VERIFIED_BADGE_THRESHOLD,
  VERIFIED_BADGE_EXPIRATION_MS,
  VerificationStatus,
  // Check functions
  canUserVerify,
  canVerifyNow,
  isInCooldown,
  isSpotVerified,
  getUserTrustLevel,
  getValidationWeight,
  canReportObsolete,
  checkVerifiedBadge,
  checkBadgeExpiration,
  // Getters
  getLastVerificationTime,
  getRemainingCooldownMs,
  getRemainingCooldown,
  getSpotVerification,
  getVerifiedSpots,
  getSpotValidations,
  calculateSpotValidationWeight,
  getVerificationsByUser,
  getUserVerificationCount,
  getVerificationStats,
  getStoredVerifications,
  // Actions
  verifySpot,
  revokeVerification,
  clearAllVerifications,
  // Render functions
  renderVerificationBadge,
  renderVerificationButton,
  renderCooldownInfo,
  formatVerificationDate,
};
