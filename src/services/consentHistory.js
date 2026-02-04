/**
 * Consent History Service (RGPD / GDPR)
 * Tracks user consent changes over time for compliance
 */

import { Storage } from '../utils/storage.js';

// Storage key for consent history
const CONSENT_HISTORY_KEY = 'consent_history';

// Maximum number of entries to keep (GDPR recommends keeping for 3 years minimum)
const MAX_HISTORY_ENTRIES = 100;

/**
 * Consent types that can be tracked
 */
export const CONSENT_TYPES = {
  COOKIES: 'cookies',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  PERSONALIZATION: 'personalization',
  GEOLOCATION: 'geolocation',
  NOTIFICATIONS: 'notifications',
  DATA_PROCESSING: 'data_processing',
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
  AGE_VERIFICATION: 'age_verification',
};

/**
 * Action types for consent changes
 */
export const CONSENT_ACTIONS = {
  ACCEPTED: 'accepted',
  REFUSED: 'refused',
  MODIFIED: 'modified',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
};

/**
 * Get consent history from storage
 * @returns {Object[]} Array of consent history entries
 */
export function getConsentHistory() {
  const history = Storage.get(CONSENT_HISTORY_KEY);
  return Array.isArray(history) ? history : [];
}

/**
 * Add a consent entry to history
 * @param {Object} entry - Consent entry
 * @param {string} entry.type - Type of consent (from CONSENT_TYPES)
 * @param {string} entry.action - Action taken (from CONSENT_ACTIONS)
 * @param {any} entry.value - The consent value (true/false/object)
 * @param {string} [entry.source] - Where the consent was given (banner, settings, signup)
 * @param {string} [entry.ip] - IP address (optional, for compliance)
 * @param {string} [entry.userAgent] - Browser user agent
 * @returns {boolean} Success status
 */
export function addConsentEntry(entry) {
  try {
    const history = getConsentHistory();

    const newEntry = {
      id: generateEntryId(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
      type: entry.type,
      action: entry.action,
      value: entry.value,
      source: entry.source || 'unknown',
      userAgent: entry.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
      version: '1.0', // Consent format version
    };

    // Add to beginning of array (most recent first)
    history.unshift(newEntry);

    // Trim to max entries
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }

    return Storage.set(CONSENT_HISTORY_KEY, history);
  } catch (error) {
    console.error('Error adding consent entry:', error);
    return false;
  }
}

/**
 * Record cookie consent change
 * @param {Object} preferences - Cookie preferences object
 * @param {string} action - Action type
 * @param {string} source - Source of consent (banner, settings)
 */
export function recordCookieConsent(preferences, action, source = 'banner') {
  return addConsentEntry({
    type: CONSENT_TYPES.COOKIES,
    action,
    value: preferences,
    source,
  });
}

/**
 * Record geolocation consent
 * @param {boolean} accepted - Whether geolocation was accepted
 * @param {string} source - Source of consent
 */
export function recordGeolocationConsent(accepted, source = 'permission_modal') {
  return addConsentEntry({
    type: CONSENT_TYPES.GEOLOCATION,
    action: accepted ? CONSENT_ACTIONS.ACCEPTED : CONSENT_ACTIONS.REFUSED,
    value: accepted,
    source,
  });
}

/**
 * Record notification consent
 * @param {boolean} accepted - Whether notifications were accepted
 * @param {string} source - Source of consent
 */
export function recordNotificationConsent(accepted, source = 'permission_request') {
  return addConsentEntry({
    type: CONSENT_TYPES.NOTIFICATIONS,
    action: accepted ? CONSENT_ACTIONS.ACCEPTED : CONSENT_ACTIONS.REFUSED,
    value: accepted,
    source,
  });
}

/**
 * Record age verification consent
 * @param {Object} data - Age verification data
 * @param {Date|string} data.birthDate - User's birth date
 * @param {number} data.age - Calculated age
 * @param {boolean} data.isValid - Whether age requirement is met
 * @param {string} data.country - Country code (for different age limits)
 */
export function recordAgeVerification(data) {
  return addConsentEntry({
    type: CONSENT_TYPES.AGE_VERIFICATION,
    action: data.isValid ? CONSENT_ACTIONS.ACCEPTED : CONSENT_ACTIONS.REFUSED,
    value: {
      isValid: data.isValid,
      verifiedAt: Date.now(),
      country: data.country || 'unknown',
      // Don't store actual birthDate for privacy - just store if valid
    },
    source: 'signup',
  });
}

/**
 * Record terms of service acceptance
 * @param {string} version - Version of terms accepted
 */
export function recordTermsAcceptance(version = '1.0') {
  return addConsentEntry({
    type: CONSENT_TYPES.TERMS_OF_SERVICE,
    action: CONSENT_ACTIONS.ACCEPTED,
    value: { version, acceptedAt: Date.now() },
    source: 'signup',
  });
}

/**
 * Record privacy policy acceptance
 * @param {string} version - Version of policy accepted
 */
export function recordPrivacyPolicyAcceptance(version = '1.0') {
  return addConsentEntry({
    type: CONSENT_TYPES.PRIVACY_POLICY,
    action: CONSENT_ACTIONS.ACCEPTED,
    value: { version, acceptedAt: Date.now() },
    source: 'signup',
  });
}

/**
 * Record consent withdrawal
 * @param {string} type - Type of consent being withdrawn
 * @param {string} source - Source of withdrawal
 */
export function recordConsentWithdrawal(type, source = 'settings') {
  return addConsentEntry({
    type,
    action: CONSENT_ACTIONS.WITHDRAWN,
    value: false,
    source,
  });
}

/**
 * Get consent status for a specific type
 * @param {string} type - Consent type
 * @returns {Object|null} Most recent consent entry for this type
 */
export function getConsentStatus(type) {
  const history = getConsentHistory();
  return history.find(entry => entry.type === type) || null;
}

/**
 * Get all current consent statuses
 * @returns {Object} Object with consent type as key and latest status as value
 */
export function getAllConsentStatuses() {
  const history = getConsentHistory();
  const statuses = {};

  // Go through history and get latest status for each type
  for (const entry of history) {
    if (!statuses[entry.type]) {
      statuses[entry.type] = {
        action: entry.action,
        value: entry.value,
        timestamp: entry.timestamp,
        date: entry.date,
      };
    }
  }

  return statuses;
}

/**
 * Check if a specific consent is currently active/accepted
 * @param {string} type - Consent type
 * @returns {boolean} Whether consent is currently active
 */
export function isConsentActive(type) {
  const status = getConsentStatus(type);
  if (!status) return false;
  return status.action === CONSENT_ACTIONS.ACCEPTED && status.value !== false;
}

/**
 * Get consent history for a specific type
 * @param {string} type - Consent type
 * @returns {Object[]} Array of history entries for this type
 */
export function getConsentHistoryByType(type) {
  const history = getConsentHistory();
  return history.filter(entry => entry.type === type);
}

/**
 * Export consent history for GDPR data request
 * @returns {Object} Consent history export
 */
export function exportConsentHistory() {
  const history = getConsentHistory();
  return {
    exportedAt: new Date().toISOString(),
    totalEntries: history.length,
    entries: history,
    consentTypes: Object.values(CONSENT_TYPES),
  };
}

/**
 * Clear consent history (for account deletion)
 * @returns {boolean} Success status
 */
export function clearConsentHistory() {
  return Storage.remove(CONSENT_HISTORY_KEY);
}

/**
 * Generate unique entry ID
 * @returns {string} Unique ID
 */
function generateEntryId() {
  return `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get summary statistics for consent history
 * @returns {Object} Summary statistics
 */
export function getConsentSummary() {
  const history = getConsentHistory();
  const statuses = getAllConsentStatuses();

  const summary = {
    totalChanges: history.length,
    firstConsentDate: history.length > 0 ? history[history.length - 1].date : null,
    lastConsentDate: history.length > 0 ? history[0].date : null,
    currentStatuses: {},
  };

  // Build current statuses
  for (const type of Object.values(CONSENT_TYPES)) {
    const status = statuses[type];
    summary.currentStatuses[type] = status
      ? {
          accepted: status.action === CONSENT_ACTIONS.ACCEPTED,
          lastUpdated: status.date,
        }
      : { accepted: false, lastUpdated: null };
  }

  return summary;
}

export default {
  CONSENT_TYPES,
  CONSENT_ACTIONS,
  getConsentHistory,
  addConsentEntry,
  recordCookieConsent,
  recordGeolocationConsent,
  recordNotificationConsent,
  recordAgeVerification,
  recordTermsAcceptance,
  recordPrivacyPolicyAcceptance,
  recordConsentWithdrawal,
  getConsentStatus,
  getAllConsentStatuses,
  isConsentActive,
  getConsentHistoryByType,
  exportConsentHistory,
  clearConsentHistory,
  getConsentSummary,
};
