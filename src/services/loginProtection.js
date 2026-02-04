/**
 * Login Protection Service
 * Blocks login attempts after X failed tries to prevent brute force attacks
 */

const STORAGE_KEY = 'spothitch_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get login attempts data from storage
 * @returns {Object} Login attempts data
 */
function getAttemptsData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to read login attempts data:', e);
  }
  return {};
}

/**
 * Save login attempts data to storage
 * @param {Object} data - Login attempts data
 */
function saveAttemptsData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save login attempts data:', e);
  }
}

/**
 * Get attempts info for an email
 * @param {string} email - User email
 * @returns {Object} Attempts info { count, lockedUntil }
 */
function getEmailAttempts(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const data = getAttemptsData();
  return data[normalizedEmail] || { count: 0, lockedUntil: null, firstAttempt: null };
}

/**
 * Check if a login is blocked for an email
 * @param {string} email - User email
 * @returns {Object} { blocked, remainingTime, attemptsLeft }
 */
export function checkLoginBlocked(email) {
  if (!email) {
    return { blocked: false, remainingTime: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  const attempts = getEmailAttempts(email);
  const now = Date.now();

  // Check if locked and lockout has expired
  if (attempts.lockedUntil) {
    if (now >= attempts.lockedUntil) {
      // Lockout expired, reset
      resetLoginAttempts(email);
      return { blocked: false, remainingTime: 0, attemptsLeft: MAX_ATTEMPTS };
    } else {
      // Still locked
      const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
      return { blocked: true, remainingTime, attemptsLeft: 0 };
    }
  }

  // Not locked, return attempts left
  const attemptsLeft = MAX_ATTEMPTS - attempts.count;
  return { blocked: false, remainingTime: 0, attemptsLeft };
}

/**
 * Check if a login email is blocked
 * @param {string} email - User email
 * @returns {boolean} True if email is blocked
 */
export function isBlocked(email) {
  if (!email) return false;
  const result = checkLoginBlocked(email);
  return result.blocked;
}

/**
 * Get remaining block time in minutes
 * @param {string} email - User email
 * @returns {number} Minutes remaining, 0 if not blocked
 */
export function getRemainingBlockTime(email) {
  if (!email) return 0;
  const result = checkLoginBlocked(email);
  return result.remainingTime;
}

/**
 * Get number of failed attempts for an email
 * @param {string} email - User email
 * @returns {number} Number of failed attempts
 */
export function getAttemptCount(email) {
  if (!email) return 0;
  const attempts = getEmailAttempts(email);
  return attempts.count;
}

/**
 * Clear attempts for an email (alias for resetLoginAttempts)
 * @param {string} email - User email
 */
export function clearAttempts(email) {
  resetLoginAttempts(email);
}

/**
 * Record a failed login attempt
 * @param {string} email - User email
 * @returns {Object} { blocked, remainingTime, attemptsLeft }
 */
export function recordFailedAttempt(email) {
  if (!email) {
    return { blocked: false, remainingTime: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const data = getAttemptsData();
  const now = Date.now();

  // Get or create entry
  let attempts = data[normalizedEmail] || { count: 0, lockedUntil: null, firstAttempt: null };

  // Check if previously locked and lockout expired
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    attempts = { count: 0, lockedUntil: null, firstAttempt: null };
  }

  // Reset if first attempt was more than lockout duration ago
  if (attempts.firstAttempt && now - attempts.firstAttempt > LOCKOUT_DURATION_MS) {
    attempts = { count: 0, lockedUntil: null, firstAttempt: null };
  }

  // Record attempt
  attempts.count += 1;
  if (!attempts.firstAttempt) {
    attempts.firstAttempt = now;
  }
  attempts.lastAttempt = now;

  // Check if should lock
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION_MS;
    data[normalizedEmail] = attempts;
    saveAttemptsData(data);

    const remainingTime = Math.ceil(LOCKOUT_DURATION_MS / 1000 / 60);
    return { blocked: true, remainingTime, attemptsLeft: 0 };
  }

  // Save and return
  data[normalizedEmail] = attempts;
  saveAttemptsData(data);

  const attemptsLeft = MAX_ATTEMPTS - attempts.count;
  return { blocked: false, remainingTime: 0, attemptsLeft };
}

/**
 * Record a successful login (reset attempts)
 * @param {string} email - User email
 */
export function recordSuccessfulLogin(email) {
  if (!email) return;
  resetLoginAttempts(email);
}

/**
 * Reset login attempts for an email
 * @param {string} email - User email
 */
export function resetLoginAttempts(email) {
  if (!email) return;

  const normalizedEmail = email.toLowerCase().trim();
  const data = getAttemptsData();

  if (data[normalizedEmail]) {
    delete data[normalizedEmail];
    saveAttemptsData(data);
  }
}

/**
 * Get lockout message for display
 * @param {number} remainingMinutes - Minutes remaining
 * @returns {string} Localized message
 */
export function getLockoutMessage(remainingMinutes) {
  if (remainingMinutes <= 1) {
    return 'Compte temporairement bloque. Reessaie dans moins d\'une minute.';
  }
  return `Compte temporairement bloque apres trop de tentatives. Reessaie dans ${remainingMinutes} minutes.`;
}

/**
 * Get warning message for remaining attempts
 * @param {number} attemptsLeft - Attempts remaining
 * @returns {string|null} Warning message or null
 */
export function getAttemptsWarningMessage(attemptsLeft) {
  if (attemptsLeft <= 0) {
    return null;
  }
  if (attemptsLeft === 1) {
    return 'Attention : derniere tentative avant blocage temporaire !';
  }
  if (attemptsLeft <= 2) {
    return `Attention : ${attemptsLeft} tentatives restantes avant blocage.`;
  }
  return null;
}

/**
 * Clean up old entries (call periodically)
 */
export function cleanupOldEntries() {
  const data = getAttemptsData();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let changed = false;

  for (const email in data) {
    const entry = data[email];
    const lastActivity = entry.lastAttempt || entry.firstAttempt || 0;

    // Remove entries older than 24 hours with no lockout
    if (!entry.lockedUntil && now - lastActivity > maxAge) {
      delete data[email];
      changed = true;
    }
    // Remove entries with expired lockouts older than 24 hours
    else if (entry.lockedUntil && now - entry.lockedUntil > maxAge) {
      delete data[email];
      changed = true;
    }
  }

  if (changed) {
    saveAttemptsData(data);
  }
}

// Export constants for testing
export const LOGIN_PROTECTION_CONFIG = {
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  STORAGE_KEY,
};

export default {
  checkLoginBlocked,
  recordFailedAttempt,
  recordSuccessfulLogin,
  resetLoginAttempts,
  isBlocked,
  getRemainingBlockTime,
  getAttemptCount,
  clearAttempts,
  getLockoutMessage,
  getAttemptsWarningMessage,
  cleanupOldEntries,
  LOGIN_PROTECTION_CONFIG,
};
