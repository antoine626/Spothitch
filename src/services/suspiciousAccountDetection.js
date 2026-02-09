/**
 * Suspicious Account Detection Service
 * Feature #14 - Detection de comptes suspects
 *
 * Signaux d'alerte SANS ban automatique :
 * - Compte < 24h avec beaucoup de messages
 * - Plusieurs signalements recus
 * - Comportement anormal (spam, pattern suspect)
 *
 * Actions :
 * - Badge "Nouveau" visible sur le profil
 * - Moderation prioritaire (file d'attente)
 * - JAMAIS de ban automatique - toujours decision humaine
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage keys
const SUSPICIOUS_ACCOUNTS_KEY = 'spothitch_suspicious_accounts';
const ACCOUNT_ACTIVITY_KEY = 'spothitch_account_activity';
const MODERATION_QUEUE_KEY = 'spothitch_moderation_queue';
const SUSPICIOUS_CHECKINS_KEY = 'spothitch_suspicious_checkins';
const GEOLOC_THRESHOLD_KEY = 'spothitch_geoloc_threshold';

// Thresholds for suspicious behavior detection
export const DETECTION_THRESHOLDS = {
  // Account age thresholds
  NEW_ACCOUNT_HOURS: 24, // Compte considere "nouveau" si < 24h
  VERY_NEW_ACCOUNT_HOURS: 1, // Compte tres recent (< 1h) = surveillance accrue

  // Message thresholds (for new accounts < 24h)
  MAX_MESSAGES_NEW_ACCOUNT: 50, // Max messages pour un compte < 24h
  MAX_MESSAGES_PER_HOUR: 30, // Max messages par heure
  MAX_MESSAGES_PER_MINUTE: 10, // Spam detection

  // Report thresholds
  REPORTS_YELLOW_FLAG: 2, // 2 signalements = attention
  REPORTS_RED_FLAG: 5, // 5 signalements = moderation prioritaire

  // Check-in thresholds
  MAX_CHECKINS_PER_HOUR: 10, // Max check-ins par heure (anti-spam)
  MAX_CHECKINS_PER_DAY: 50, // Max check-ins par jour

  // Friend request thresholds
  MAX_FRIEND_REQUESTS_PER_DAY: 20, // Max demandes d'amis par jour

  // Spot creation thresholds
  MAX_SPOTS_PER_HOUR: 5, // Max spots crees par heure
  MAX_SPOTS_PER_DAY: 20, // Max spots crees par jour
};

/**
 * Suspicious account status enum
 */
export const SuspicionLevel = {
  NONE: 'none', // Pas de suspicion
  LOW: 'low', // Attention legere (nouveau compte)
  MEDIUM: 'medium', // Attention moyenne (activite inhabituelle)
  HIGH: 'high', // Attention elevee (multiple flags)
  CRITICAL: 'critical', // Moderation prioritaire urgente
};

/**
 * Alert types enum
 */
export const AlertType = {
  NEW_ACCOUNT: 'new_account',
  HIGH_MESSAGE_VOLUME: 'high_message_volume',
  SPAM_DETECTED: 'spam_detected',
  MULTIPLE_REPORTS: 'multiple_reports',
  RAPID_FRIEND_REQUESTS: 'rapid_friend_requests',
  EXCESSIVE_CHECKINS: 'excessive_checkins',
  EXCESSIVE_SPOT_CREATION: 'excessive_spot_creation',
  ABNORMAL_PATTERN: 'abnormal_pattern',
  SUSPICIOUS_GEOLOC: 'suspicious_geoloc',
};

/**
 * Get suspicious accounts data from storage
 * @returns {Object} Suspicious accounts data
 */
function getSuspiciousAccountsData() {
  try {
    const data = Storage.get(SUSPICIOUS_ACCOUNTS_KEY);
    return data || {};
  } catch (error) {
    console.error('[SuspiciousDetection] Error reading data:', error);
    return {};
  }
}

/**
 * Save suspicious accounts data to storage
 * @param {Object} data - Suspicious accounts data
 */
function saveSuspiciousAccountsData(data) {
  try {
    Storage.set(SUSPICIOUS_ACCOUNTS_KEY, data);
  } catch (error) {
    console.error('[SuspiciousDetection] Error saving data:', error);
  }
}

/**
 * Get account activity data from storage
 * @returns {Object} Account activity data
 */
function getAccountActivityData() {
  try {
    const data = Storage.get(ACCOUNT_ACTIVITY_KEY);
    return data || {};
  } catch (error) {
    console.error('[SuspiciousDetection] Error reading activity data:', error);
    return {};
  }
}

/**
 * Save account activity data to storage
 * @param {Object} data - Account activity data
 */
function saveAccountActivityData(data) {
  try {
    Storage.set(ACCOUNT_ACTIVITY_KEY, data);
  } catch (error) {
    console.error('[SuspiciousDetection] Error saving activity data:', error);
  }
}

/**
 * Get moderation queue from storage
 * @returns {Array} Moderation queue
 */
function getModerationQueueData() {
  try {
    const data = Storage.get(MODERATION_QUEUE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[SuspiciousDetection] Error reading moderation queue:', error);
    return [];
  }
}

/**
 * Save moderation queue to storage
 * @param {Array} queue - Moderation queue
 */
function saveModerationQueueData(queue) {
  try {
    Storage.set(MODERATION_QUEUE_KEY, queue);
  } catch (error) {
    console.error('[SuspiciousDetection] Error saving moderation queue:', error);
  }
}

/**
 * Calculate account age in hours
 * @param {string} createdAt - Account creation timestamp (ISO string)
 * @returns {number} Age in hours
 */
export function getAccountAgeHours(createdAt) {
  if (!createdAt) return Infinity; // Unknown creation date = assume old account
  try {
    const created = new Date(createdAt).getTime();
    // Handle invalid dates that result in NaN
    if (isNaN(created)) return Infinity;
    const now = Date.now();
    return (now - created) / (1000 * 60 * 60);
  } catch {
    return Infinity;
  }
}

/**
 * Check if account is new (< 24h)
 * @param {string} createdAt - Account creation timestamp
 * @returns {boolean} True if account is new
 */
export function isNewAccount(createdAt) {
  const ageHours = getAccountAgeHours(createdAt);
  return ageHours < DETECTION_THRESHOLDS.NEW_ACCOUNT_HOURS;
}

/**
 * Check if account is very new (< 1h)
 * @param {string} createdAt - Account creation timestamp
 * @returns {boolean} True if account is very new
 */
export function isVeryNewAccount(createdAt) {
  const ageHours = getAccountAgeHours(createdAt);
  return ageHours < DETECTION_THRESHOLDS.VERY_NEW_ACCOUNT_HOURS;
}

/**
 * Record account activity
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity (message, checkin, friend_request, spot_created)
 * @returns {Object} Updated activity record
 */
export function recordActivity(userId, activityType) {
  if (!userId || !activityType) return null;

  const data = getAccountActivityData();
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  const dayAgo = now - (24 * 60 * 60 * 1000);
  const minuteAgo = now - (60 * 1000);

  // Initialize user activity if not exists
  if (!data[userId]) {
    data[userId] = {
      activities: [],
      firstSeen: now,
    };
  }

  // Add new activity
  data[userId].activities.push({
    type: activityType,
    timestamp: now,
  });

  // Clean up old activities (keep only last 24h)
  data[userId].activities = data[userId].activities.filter(
    a => a.timestamp > dayAgo
  );

  // Calculate counts
  const activities = data[userId].activities;

  const counts = {
    lastMinute: activities.filter(a => a.timestamp > minuteAgo && a.type === activityType).length,
    lastHour: activities.filter(a => a.timestamp > hourAgo && a.type === activityType).length,
    lastDay: activities.filter(a => a.type === activityType).length,
    total: activities.length,
  };

  data[userId].counts = counts;
  data[userId].lastActivity = now;

  saveAccountActivityData(data);

  return { userId, activityType, counts };
}

/**
 * Get activity counts for a user
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity (optional)
 * @returns {Object} Activity counts
 */
export function getActivityCounts(userId, activityType = null) {
  if (!userId) return { lastMinute: 0, lastHour: 0, lastDay: 0, total: 0 };

  const data = getAccountActivityData();
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  const dayAgo = now - (24 * 60 * 60 * 1000);
  const minuteAgo = now - (60 * 1000);

  if (!data[userId] || !data[userId].activities) {
    return { lastMinute: 0, lastHour: 0, lastDay: 0, total: 0 };
  }

  let activities = data[userId].activities;

  // Filter by type if specified
  if (activityType) {
    activities = activities.filter(a => a.type === activityType);
  }

  return {
    lastMinute: activities.filter(a => a.timestamp > minuteAgo).length,
    lastHour: activities.filter(a => a.timestamp > hourAgo).length,
    lastDay: activities.filter(a => a.timestamp > dayAgo).length,
    total: activities.length,
  };
}

/**
 * Get geolocation threshold in meters
 * @returns {number} Threshold in meters (default 500m)
 */
export function getGeolocThreshold() {
  try {
    const threshold = Storage.get(GEOLOC_THRESHOLD_KEY);
    return threshold !== null && threshold !== undefined ? threshold : 500;
  } catch (error) {
    return 500;
  }
}

/**
 * Set geolocation threshold in meters
 * @param {number} meters - Threshold in meters
 */
export function setGeolocThreshold(meters) {
  if (typeof meters !== 'number' || meters < 0) {
    throw new Error('Threshold must be a positive number');
  }
  Storage.set(GEOLOC_THRESHOLD_KEY, meters);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1 (degrees)
 * @param {number} lon1 - Longitude 1 (degrees)
 * @param {number} lat2 - Latitude 2 (degrees)
 * @param {number} lon2 - Longitude 2 (degrees)
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check geolocation consistency for a check-in
 * @param {string} userId - User ID
 * @param {Object} checkinLocation - User's location at check-in { lat, lon }
 * @param {Object} spotLocation - Spot's location { lat, lon }
 * @returns {Object} { consistent, distance, threshold }
 */
export function checkGeolocConsistency(userId, checkinLocation, spotLocation) {
  if (!userId || !checkinLocation || !spotLocation) {
    return { consistent: true, distance: 0, threshold: 0, error: 'invalid_params' };
  }

  const { lat: checkinLat, lon: checkinLon } = checkinLocation;
  const { lat: spotLat, lon: spotLon } = spotLocation;

  if (
    typeof checkinLat !== 'number' ||
    typeof checkinLon !== 'number' ||
    typeof spotLat !== 'number' ||
    typeof spotLon !== 'number'
  ) {
    return { consistent: true, distance: 0, threshold: 0, error: 'invalid_coordinates' };
  }

  const distance = calculateDistance(checkinLat, checkinLon, spotLat, spotLon);
  const threshold = getGeolocThreshold();

  return {
    consistent: distance <= threshold,
    distance,
    threshold,
  };
}

/**
 * Get suspicious check-ins data from storage
 * @returns {Object} Suspicious check-ins data
 */
function getSuspiciousCheckinsData() {
  try {
    const data = Storage.get(SUSPICIOUS_CHECKINS_KEY);
    return data || {};
  } catch (error) {
    console.error('[SuspiciousDetection] Error reading suspicious checkins:', error);
    return {};
  }
}

/**
 * Save suspicious check-ins data to storage
 * @param {Object} data - Suspicious check-ins data
 */
function saveSuspiciousCheckinsData(data) {
  try {
    Storage.set(SUSPICIOUS_CHECKINS_KEY, data);
  } catch (error) {
    console.error('[SuspiciousDetection] Error saving suspicious checkins:', error);
  }
}

/**
 * Flag a suspicious check-in
 * @param {string} userId - User ID
 * @param {Object} checkinData - Check-in data { spotId, checkinLocation, spotLocation, distance }
 * @returns {Object} Result
 */
export function flagSuspiciousCheckin(userId, checkinData) {
  if (!userId || !checkinData) {
    return { success: false, error: 'invalid_params' };
  }

  const { spotId, checkinLocation, spotLocation, distance } = checkinData;

  if (!spotId || !checkinLocation || !spotLocation) {
    return { success: false, error: 'missing_data' };
  }

  const data = getSuspiciousCheckinsData();

  if (!data[userId]) {
    data[userId] = [];
  }

  const flaggedCheckin = {
    spotId,
    checkinLocation,
    spotLocation,
    distance: distance !== undefined ? distance : calculateDistance(
      checkinLocation.lat,
      checkinLocation.lon,
      spotLocation.lat,
      spotLocation.lon
    ),
    threshold: getGeolocThreshold(),
    flaggedAt: Date.now(),
  };

  data[userId].push(flaggedCheckin);

  // Keep only last 100 suspicious check-ins per user
  if (data[userId].length > 100) {
    data[userId] = data[userId].slice(-100);
  }

  saveSuspiciousCheckinsData(data);

  return { success: true, data: flaggedCheckin };
}

/**
 * Get suspicious check-ins for a user
 * @param {string} userId - User ID
 * @returns {Array} Suspicious check-ins
 */
export function getSuspiciousCheckins(userId) {
  if (!userId) return [];

  const data = getSuspiciousCheckinsData();
  return data[userId] || [];
}

/**
 * Analyze account for suspicious behavior
 * @param {string} userId - User ID
 * @param {Object} userInfo - User information (createdAt, reportCount, etc.)
 * @returns {Object} Analysis result with suspicion level and alerts
 */
export function analyzeAccount(userId, userInfo = {}) {
  if (!userId) {
    return {
      suspicionLevel: SuspicionLevel.NONE,
      alerts: [],
      isNewAccount: false,
      requiresModeration: false,
    };
  }

  const alerts = [];
  let maxLevel = SuspicionLevel.NONE;

  const { createdAt, reportCount = 0 } = userInfo;

  // Check 1: New account
  const accountNew = isNewAccount(createdAt);
  const accountVeryNew = isVeryNewAccount(createdAt);

  if (accountVeryNew) {
    alerts.push({
      type: AlertType.NEW_ACCOUNT,
      severity: 'high',
      message: 'Compte cree il y a moins d\'une heure',
      timestamp: Date.now(),
    });
    maxLevel = SuspicionLevel.MEDIUM;
  } else if (accountNew) {
    alerts.push({
      type: AlertType.NEW_ACCOUNT,
      severity: 'low',
      message: 'Compte cree il y a moins de 24 heures',
      timestamp: Date.now(),
    });
    if (maxLevel === SuspicionLevel.NONE) {
      maxLevel = SuspicionLevel.LOW;
    }
  }

  // Check 2: Message volume for new accounts
  const messageCounts = getActivityCounts(userId, 'message');

  if (accountNew && messageCounts.lastDay > DETECTION_THRESHOLDS.MAX_MESSAGES_NEW_ACCOUNT) {
    alerts.push({
      type: AlertType.HIGH_MESSAGE_VOLUME,
      severity: 'high',
      message: `${messageCounts.lastDay} messages envoyes en moins de 24h pour un nouveau compte`,
      timestamp: Date.now(),
    });
    maxLevel = SuspicionLevel.HIGH;
  }

  // Check 3: Spam detection (messages per minute)
  if (messageCounts.lastMinute >= DETECTION_THRESHOLDS.MAX_MESSAGES_PER_MINUTE) {
    alerts.push({
      type: AlertType.SPAM_DETECTED,
      severity: 'critical',
      message: `Spam detecte: ${messageCounts.lastMinute} messages en 1 minute`,
      timestamp: Date.now(),
    });
    maxLevel = SuspicionLevel.CRITICAL;
  } else if (messageCounts.lastHour >= DETECTION_THRESHOLDS.MAX_MESSAGES_PER_HOUR) {
    alerts.push({
      type: AlertType.HIGH_MESSAGE_VOLUME,
      severity: 'medium',
      message: `Volume eleve: ${messageCounts.lastHour} messages en 1 heure`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  }

  // Check 4: Multiple reports
  if (reportCount >= DETECTION_THRESHOLDS.REPORTS_RED_FLAG) {
    alerts.push({
      type: AlertType.MULTIPLE_REPORTS,
      severity: 'critical',
      message: `${reportCount} signalements recus`,
      timestamp: Date.now(),
    });
    maxLevel = SuspicionLevel.CRITICAL;
  } else if (reportCount >= DETECTION_THRESHOLDS.REPORTS_YELLOW_FLAG) {
    alerts.push({
      type: AlertType.MULTIPLE_REPORTS,
      severity: 'medium',
      message: `${reportCount} signalements recus`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL && maxLevel !== SuspicionLevel.HIGH) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  }

  // Check 5: Rapid friend requests
  const friendRequestCounts = getActivityCounts(userId, 'friend_request');

  if (friendRequestCounts.lastDay >= DETECTION_THRESHOLDS.MAX_FRIEND_REQUESTS_PER_DAY) {
    alerts.push({
      type: AlertType.RAPID_FRIEND_REQUESTS,
      severity: 'medium',
      message: `${friendRequestCounts.lastDay} demandes d'amis en 24h`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL && maxLevel !== SuspicionLevel.HIGH) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  }

  // Check 6: Excessive check-ins
  const checkinCounts = getActivityCounts(userId, 'checkin');

  if (checkinCounts.lastHour >= DETECTION_THRESHOLDS.MAX_CHECKINS_PER_HOUR) {
    alerts.push({
      type: AlertType.EXCESSIVE_CHECKINS,
      severity: 'medium',
      message: `${checkinCounts.lastHour} check-ins en 1 heure`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL && maxLevel !== SuspicionLevel.HIGH) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  } else if (checkinCounts.lastDay >= DETECTION_THRESHOLDS.MAX_CHECKINS_PER_DAY) {
    alerts.push({
      type: AlertType.EXCESSIVE_CHECKINS,
      severity: 'low',
      message: `${checkinCounts.lastDay} check-ins en 24h`,
      timestamp: Date.now(),
    });
  }

  // Check 7: Excessive spot creation
  const spotCounts = getActivityCounts(userId, 'spot_created');

  if (spotCounts.lastHour >= DETECTION_THRESHOLDS.MAX_SPOTS_PER_HOUR) {
    alerts.push({
      type: AlertType.EXCESSIVE_SPOT_CREATION,
      severity: 'high',
      message: `${spotCounts.lastHour} spots crees en 1 heure`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL) {
      maxLevel = SuspicionLevel.HIGH;
    }
  } else if (spotCounts.lastDay >= DETECTION_THRESHOLDS.MAX_SPOTS_PER_DAY) {
    alerts.push({
      type: AlertType.EXCESSIVE_SPOT_CREATION,
      severity: 'medium',
      message: `${spotCounts.lastDay} spots crees en 24h`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL && maxLevel !== SuspicionLevel.HIGH) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  }

  // Check 8: Suspicious geolocation check-ins
  const suspiciousCheckins = getSuspiciousCheckins(userId);
  const recentSuspiciousCheckins = suspiciousCheckins.filter(
    c => c.flaggedAt > (Date.now() - 24 * 60 * 60 * 1000)
  );

  if (recentSuspiciousCheckins.length >= 5) {
    alerts.push({
      type: AlertType.SUSPICIOUS_GEOLOC,
      severity: 'high',
      message: `${recentSuspiciousCheckins.length} check-ins suspects en 24h (geolocalisation incohérente)`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL) {
      maxLevel = SuspicionLevel.HIGH;
    }
  } else if (recentSuspiciousCheckins.length >= 2) {
    alerts.push({
      type: AlertType.SUSPICIOUS_GEOLOC,
      severity: 'medium',
      message: `${recentSuspiciousCheckins.length} check-ins suspects en 24h (geolocalisation incohérente)`,
      timestamp: Date.now(),
    });
    if (maxLevel !== SuspicionLevel.CRITICAL && maxLevel !== SuspicionLevel.HIGH) {
      maxLevel = SuspicionLevel.MEDIUM;
    }
  }

  // Determine if moderation is required
  const requiresModeration = maxLevel === SuspicionLevel.HIGH || maxLevel === SuspicionLevel.CRITICAL;

  return {
    suspicionLevel: maxLevel,
    alerts,
    isNewAccount: accountNew,
    isVeryNewAccount: accountVeryNew,
    requiresModeration,
    analyzedAt: Date.now(),
  };
}

/**
 * Flag an account as suspicious
 * @param {string} userId - User ID
 * @param {Object} analysis - Analysis result from analyzeAccount
 * @returns {Object} Flag result
 */
export function flagAccount(userId, analysis) {
  if (!userId || !analysis) {
    return { success: false, error: 'invalid_params' };
  }

  const data = getSuspiciousAccountsData();

  data[userId] = {
    ...analysis,
    flaggedAt: Date.now(),
    status: 'pending_review', // pending_review | reviewed | cleared
    reviewedBy: null,
    reviewedAt: null,
    notes: [],
  };

  saveSuspiciousAccountsData(data);

  // Add to moderation queue if requires moderation
  if (analysis.requiresModeration) {
    addToModerationQueue(userId, analysis);
  }

  return { success: true, data: data[userId] };
}

/**
 * Add account to moderation queue
 * @param {string} userId - User ID
 * @param {Object} analysis - Analysis result
 */
export function addToModerationQueue(userId, analysis) {
  if (!userId || !analysis) return;

  const queue = getModerationQueueData();

  // Check if already in queue
  const existingIndex = queue.findIndex(item => item.userId === userId);

  const queueItem = {
    userId,
    suspicionLevel: analysis.suspicionLevel,
    alerts: analysis.alerts,
    addedAt: Date.now(),
    priority: analysis.suspicionLevel === SuspicionLevel.CRITICAL ? 1 : 2,
    status: 'pending', // pending | in_review | completed
  };

  if (existingIndex >= 0) {
    // Update existing entry
    queue[existingIndex] = { ...queue[existingIndex], ...queueItem };
  } else {
    // Add new entry
    queue.push(queueItem);
  }

  // Sort by priority (critical first) then by addedAt
  queue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.addedAt - b.addedAt;
  });

  saveModerationQueueData(queue);
}

/**
 * Get moderation queue
 * @param {string} status - Filter by status (optional)
 * @returns {Array} Moderation queue items
 */
export function getModerationQueue(status = null) {
  const queue = getModerationQueueData();

  if (status) {
    return queue.filter(item => item.status === status);
  }

  return queue;
}

/**
 * Get suspicious account info
 * @param {string} userId - User ID
 * @returns {Object|null} Suspicious account data or null
 */
export function getSuspiciousAccount(userId) {
  if (!userId) return null;

  const data = getSuspiciousAccountsData();
  return data[userId] || null;
}

/**
 * Clear suspicious flag (after human review)
 * @param {string} userId - User ID
 * @param {string} reviewerId - Moderator ID who reviewed
 * @param {string} notes - Review notes
 * @returns {Object} Result
 */
export function clearSuspiciousFlag(userId, reviewerId = 'unknown', notes = '') {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const data = getSuspiciousAccountsData();

  if (!data[userId]) {
    return { success: false, error: 'not_flagged' };
  }

  data[userId].status = 'cleared';
  data[userId].reviewedBy = reviewerId;
  data[userId].reviewedAt = Date.now();
  data[userId].notes.push({
    text: notes || 'Compte verifie - pas de probleme detecte',
    addedBy: reviewerId,
    addedAt: Date.now(),
  });

  saveSuspiciousAccountsData(data);

  // Remove from moderation queue
  removeFromModerationQueue(userId);

  return { success: true };
}

/**
 * Remove account from moderation queue
 * @param {string} userId - User ID
 */
export function removeFromModerationQueue(userId) {
  if (!userId) return;

  const queue = getModerationQueueData();
  const newQueue = queue.filter(item => item.userId !== userId);
  saveModerationQueueData(newQueue);
}

/**
 * Add moderator note to suspicious account
 * @param {string} userId - User ID
 * @param {string} note - Note text
 * @param {string} addedBy - Moderator ID
 * @returns {Object} Result
 */
export function addModeratorNote(userId, note, addedBy = 'unknown') {
  if (!userId || !note) {
    return { success: false, error: 'invalid_params' };
  }

  const data = getSuspiciousAccountsData();

  if (!data[userId]) {
    return { success: false, error: 'not_flagged' };
  }

  data[userId].notes.push({
    text: note,
    addedBy,
    addedAt: Date.now(),
  });

  saveSuspiciousAccountsData(data);

  return { success: true };
}

/**
 * Get the "New Account" badge HTML for display
 * @param {string} createdAt - Account creation timestamp
 * @returns {string} HTML string for badge or empty string
 */
export function renderNewAccountBadge(createdAt) {
  if (!isNewAccount(createdAt)) return '';

  const ageHours = getAccountAgeHours(createdAt);
  let badgeColor = 'bg-blue-500/20 text-blue-400';
  let badgeText = 'Nouveau';
  let badgeIcon = 'fa-user-plus';

  if (ageHours < 1) {
    badgeColor = 'bg-yellow-500/20 text-yellow-400';
    badgeText = 'Tres nouveau';
    badgeIcon = 'fa-exclamation-circle';
  } else if (ageHours < 6) {
    badgeColor = 'bg-blue-500/20 text-blue-400';
    badgeText = 'Nouveau';
    badgeIcon = 'fa-user-plus';
  }

  return `
    <span
      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColor}"
      title="${t('newAccountTooltip') || 'Ce compte a ete cree recemment'}"
      role="status"
      aria-label="${badgeText}"
    >
      <i class="fas ${badgeIcon}"></i>
      ${badgeText}
    </span>
  `;
}

/**
 * Get suspicion level badge HTML
 * @param {string} level - Suspicion level
 * @returns {string} HTML string for badge
 */
export function renderSuspicionBadge(level) {
  if (!level || level === SuspicionLevel.NONE) return '';

  const badges = {
    [SuspicionLevel.LOW]: {
      color: 'bg-blue-500/20 text-blue-400',
      icon: 'fa-info-circle',
      text: 'Attention',
    },
    [SuspicionLevel.MEDIUM]: {
      color: 'bg-yellow-500/20 text-yellow-400',
      icon: 'fa-exclamation-triangle',
      text: 'Surveillance',
    },
    [SuspicionLevel.HIGH]: {
      color: 'bg-orange-500/20 text-orange-400',
      icon: 'fa-exclamation-circle',
      text: 'Alerte',
    },
    [SuspicionLevel.CRITICAL]: {
      color: 'bg-red-500/20 text-red-400',
      icon: 'fa-ban',
      text: 'Urgent',
    },
  };

  const badge = badges[level];
  if (!badge) return '';

  return `
    <span
      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}"
      role="status"
      aria-label="${badge.text}"
    >
      <i class="fas ${badge.icon}"></i>
      ${badge.text}
    </span>
  `;
}

/**
 * Check if user should be rate limited for an action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @returns {Object} { allowed, reason, waitTime }
 */
export function checkRateLimit(userId, actionType) {
  if (!userId || !actionType) {
    return { allowed: true, reason: null, waitTime: 0 };
  }

  const counts = getActivityCounts(userId, actionType);

  const limits = {
    message: {
      perMinute: DETECTION_THRESHOLDS.MAX_MESSAGES_PER_MINUTE,
      perHour: DETECTION_THRESHOLDS.MAX_MESSAGES_PER_HOUR,
    },
    checkin: {
      perHour: DETECTION_THRESHOLDS.MAX_CHECKINS_PER_HOUR,
      perDay: DETECTION_THRESHOLDS.MAX_CHECKINS_PER_DAY,
    },
    friend_request: {
      perDay: DETECTION_THRESHOLDS.MAX_FRIEND_REQUESTS_PER_DAY,
    },
    spot_created: {
      perHour: DETECTION_THRESHOLDS.MAX_SPOTS_PER_HOUR,
      perDay: DETECTION_THRESHOLDS.MAX_SPOTS_PER_DAY,
    },
  };

  const limit = limits[actionType];
  if (!limit) return { allowed: true, reason: null, waitTime: 0 };

  // Check minute limit
  if (limit.perMinute && counts.lastMinute >= limit.perMinute) {
    return {
      allowed: false,
      reason: t('rateLimitMinute') || 'Trop de requetes. Attends quelques secondes.',
      waitTime: 60, // seconds
    };
  }

  // Check hour limit
  if (limit.perHour && counts.lastHour >= limit.perHour) {
    return {
      allowed: false,
      reason: t('rateLimitHour') || 'Limite atteinte. Reessaie dans une heure.',
      waitTime: 3600, // seconds
    };
  }

  // Check day limit
  if (limit.perDay && counts.lastDay >= limit.perDay) {
    return {
      allowed: false,
      reason: t('rateLimitDay') || 'Limite quotidienne atteinte. Reviens demain !',
      waitTime: 86400, // seconds
    };
  }

  return { allowed: true, reason: null, waitTime: 0 };
}

/**
 * Get statistics about suspicious accounts
 * @returns {Object} Statistics
 */
export function getSuspiciousStats() {
  const data = getSuspiciousAccountsData();
  const queue = getModerationQueueData();

  const accounts = Object.values(data);

  return {
    totalFlagged: accounts.length,
    pendingReview: accounts.filter(a => a.status === 'pending_review').length,
    reviewed: accounts.filter(a => a.status === 'reviewed').length,
    cleared: accounts.filter(a => a.status === 'cleared').length,
    byLevel: {
      low: accounts.filter(a => a.suspicionLevel === SuspicionLevel.LOW).length,
      medium: accounts.filter(a => a.suspicionLevel === SuspicionLevel.MEDIUM).length,
      high: accounts.filter(a => a.suspicionLevel === SuspicionLevel.HIGH).length,
      critical: accounts.filter(a => a.suspicionLevel === SuspicionLevel.CRITICAL).length,
    },
    queueLength: queue.length,
    priorityQueue: queue.filter(q => q.priority === 1).length,
  };
}

/**
 * Clean up old data (call periodically)
 */
export function cleanupOldData() {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  // Clean up cleared accounts older than 7 days
  const suspiciousData = getSuspiciousAccountsData();
  let suspiciousChanged = false;

  for (const userId in suspiciousData) {
    const account = suspiciousData[userId];
    if (account.status === 'cleared' && account.reviewedAt < weekAgo) {
      delete suspiciousData[userId];
      suspiciousChanged = true;
    }
  }

  if (suspiciousChanged) {
    saveSuspiciousAccountsData(suspiciousData);
  }

  // Clean up old activity data
  const activityData = getAccountActivityData();
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  let activityChanged = false;

  for (const userId in activityData) {
    const lastActivity = activityData[userId].lastActivity || 0;
    if (lastActivity < dayAgo) {
      delete activityData[userId];
      activityChanged = true;
    }
  }

  if (activityChanged) {
    saveAccountActivityData(activityData);
  }
}

// Export default with all functions
export default {
  // Constants
  DETECTION_THRESHOLDS,
  SuspicionLevel,
  AlertType,

  // Account age functions
  getAccountAgeHours,
  isNewAccount,
  isVeryNewAccount,

  // Activity tracking
  recordActivity,
  getActivityCounts,

  // Analysis
  analyzeAccount,
  flagAccount,

  // Moderation queue
  addToModerationQueue,
  getModerationQueue,
  removeFromModerationQueue,

  // Account management
  getSuspiciousAccount,
  clearSuspiciousFlag,
  addModeratorNote,

  // Rate limiting
  checkRateLimit,

  // Geolocation check-ins
  getGeolocThreshold,
  setGeolocThreshold,
  calculateDistance,
  checkGeolocConsistency,
  flagSuspiciousCheckin,
  getSuspiciousCheckins,

  // UI rendering
  renderNewAccountBadge,
  renderSuspicionBadge,

  // Statistics
  getSuspiciousStats,

  // Maintenance
  cleanupOldData,
};
