/**
 * Session Timeout Service
 * Manages user session timeout after 1 week of inactivity
 * Automatically logs out the user if session has expired
 */

import * as firebase from './firebase.js';

// 1 week in milliseconds (7 days)
export const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'spothitch_last_activity';

/**
 * Get last activity timestamp from storage
 * @returns {number} Timestamp in milliseconds, or null if never set
 */
export function getLastActivity() {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (e) {
    console.warn('Failed to read last activity:', e);
    return null;
  }
}

/**
 * Update last activity timestamp to now
 * Called whenever user interacts with the app
 */
export function updateLastActivity() {
  try {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
  } catch (e) {
    console.warn('Failed to update last activity:', e);
  }
}

/**
 * Check if session has expired
 * @returns {boolean} True if session has expired, false otherwise
 */
export function checkSessionExpired() {
  const lastActivity = getLastActivity();

  // If no activity recorded yet, session is not expired
  if (lastActivity === null) {
    return false;
  }

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;

  // Session expired if more than 7 days of inactivity
  return timeSinceLastActivity > SESSION_TIMEOUT_MS;
}

/**
 * Get remaining session time
 * @returns {Object} { expired, remainingMs, remainingDays, remainingHours }
 */
export function getRemainingSessionTime() {
  const lastActivity = getLastActivity();

  // If no activity recorded, return max time
  if (lastActivity === null) {
    return {
      expired: false,
      remainingMs: SESSION_TIMEOUT_MS,
      remainingDays: 7,
      remainingHours: 168
    };
  }

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;
  const remainingMs = Math.max(0, SESSION_TIMEOUT_MS - timeSinceLastActivity);

  // Convert to days and hours
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));

  return {
    expired: remainingMs === 0,
    remainingMs,
    remainingDays,
    remainingHours
  };
}

/**
 * Reset session (called after successful login)
 * Clears the activity timestamp to give user fresh 7-day window
 */
export function resetSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    updateLastActivity();
  } catch (e) {
    console.warn('Failed to reset session:', e);
  }
}

/**
 * Clear session (called on logout)
 * Removes the activity timestamp from storage
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

/**
 * Handle session expiration
 * Logs out the user and shows a message
 * @returns {Promise<Object>} Result of logout operation
 */
export async function handleSessionExpiration() {
  try {
    // Clear session data
    clearSession();

    // Firebase logout
    const result = await firebase.logOut();

    if (result.success) {
      console.log('Session expired - user logged out');
      return { success: true, message: 'Votre session a expire. Veuillez vous reconnecter.' };
    } else {
      console.warn('Failed to logout user on session expiration:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error handling session expiration:', error);
    return { success: false, error };
  }
}

/**
 * Check and handle session expiration if needed
 * Should be called on app initialization and periodically
 * @returns {Promise<Object>} { expired: boolean, action?: 'logout' }
 */
export async function checkAndHandleSessionExpiration() {
  if (checkSessionExpired()) {
    await handleSessionExpiration();
    return { expired: true, action: 'logout' };
  }
  return { expired: false };
}

/**
 * Setup automatic session timeout checking
 * Checks every hour if session has expired
 * @returns {number} Interval ID for cleanup if needed
 */
export function setupSessionTimeoutCheck() {
  // Check every hour (3600000 ms)
  const intervalId = setInterval(() => {
    checkAndHandleSessionExpiration();
  }, 60 * 60 * 1000);

  return intervalId;
}

/**
 * Get session timeout message for display
 * @returns {string} Localized message about session status
 */
export function getSessionTimeoutMessage() {
  const remaining = getRemainingSessionTime();

  if (remaining.expired) {
    return 'Votre session a expire. Veuillez vous reconnecter.';
  }

  if (remaining.remainingDays > 1) {
    return `Votre session expirera dans ${remaining.remainingDays} jours d'inactivite.`;
  }

  if (remaining.remainingDays === 1) {
    return 'Votre session expirera demain si vous restez inactif.';
  }

  if (remaining.remainingHours > 1) {
    return `Votre session expirera dans ${remaining.remainingHours} heures d'inactivite.`;
  }

  return 'Votre session expirera bientot. Veuillez vous reconnecter.';
}

// Export all functions as default object
export default {
  SESSION_TIMEOUT_MS,
  getLastActivity,
  updateLastActivity,
  checkSessionExpired,
  getRemainingSessionTime,
  resetSession,
  clearSession,
  handleSessionExpiration,
  checkAndHandleSessionExpiration,
  setupSessionTimeoutCheck,
  getSessionTimeoutMessage
};
