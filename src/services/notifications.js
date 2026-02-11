/**
 * Notifications Service
 * Handles push notifications and in-app toasts
 * Enhanced with social, gamification, and proximity notifications
 */

import { requestNotificationPermission, onForegroundMessage } from './firebase.js';
import { escapeHTML } from '../utils/sanitize.js';
import { getErrorMessage, getFormattedError } from '../utils/errorMessages.js';
import { getState, setState, subscribe } from '../stores/state.js';
import { t } from '../i18n/index.js';

// Toast container reference
let toastContainer = null;

// Notification preferences storage key
const NOTIFICATION_PREFS_KEY = 'spothitch_notification_prefs';

// Default notification preferences
const DEFAULT_NOTIFICATION_PREFS = {
  enabled: true,
  // Social notifications
  newFriend: true,
  newMessage: true,
  friendNearby: true,
  // Gamification notifications
  badgeUnlocked: true,
  levelUp: true,
  streakReminder: true,
  dailyReward: true,
  // Spot notifications
  spotCheckin: true,
  spotRating: true,
  spotComment: true,
  // System notifications
  appUpdates: true,
  tips: true,
  // Timing preferences
  quietHoursEnabled: false,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8, // 8 AM
  // Nearby distance threshold (in km)
  nearbyDistance: 10,
};

// Scheduled notification IDs
const scheduledNotifications = new Map();

// Streak reminder check interval (1 hour)
let streakCheckInterval = null;

/**
 * Initialize notifications
 */
export async function initNotifications() {
  // Create toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  // Request push notification permission
  if ('Notification' in window) {
    const token = await requestNotificationPermission();
    if (token) {
      console.log('✅ Push notifications enabled');
      // Save token to server for sending notifications
      await saveNotificationToken(token);
    }
  }

  // Listen for foreground messages
  onForegroundMessage((payload) => {
    console.log('📬 Foreground message:', payload);
    showToast(payload.notification?.body || 'Nouvelle notification', 'info');
  });
}

/**
 * Save notification token to backend
 */
async function saveNotificationToken(token) {
  // In a real app, save this to your backend
  console.log('FCM Token:', token);
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.pointerEvents = 'auto';

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  toast.innerHTML = `
    <span style="font-size: 20px">${icons[type] || icons.info}</span>
    <span>${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  // Add fadeOut animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      to { opacity: 0; transform: translateY(-20px); }
    }
  `;
  if (!document.querySelector('#toast-animations')) {
    style.id = 'toast-animations';
    document.head.appendChild(style);
  }
}

/**
 * Show success toast
 */
export function showSuccess(message, duration) {
  showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - Error message or error code
 * @param {number} duration - Duration in ms
 */
export function showError(message, duration) {
  showToast(message, 'error', duration);
}

/**
 * Show friendly error toast based on error code
 * Uses humorous, user-friendly messages
 * @param {string} errorCode - Error code (e.g., 'NETWORK_OFFLINE', 'auth/user-not-found')
 * @param {number} duration - Duration in ms
 */
export function showFriendlyError(errorCode, duration = 5000) {
  const errorInfo = getErrorMessage(errorCode);
  const fullMessage = `${errorInfo.icon} ${errorInfo.message}`;
  showToast(fullMessage, errorInfo.type, duration);
}

/**
 * Show info toast
 */
export function showInfo(message, duration) {
  showToast(message, 'info', duration);
}

/**
 * Show warning toast
 */
export function showWarning(message, duration) {
  showToast(message, 'warning', duration);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {'polite' | 'assertive'} priority - Announcement priority
 */
export function announce(message, priority = 'polite') {
  const region = document.getElementById(`aria-live-${priority}`);
  if (region) {
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }
}

/**
 * Send local notification (when app is open)
 */
export function sendLocalNotification(title, body, data = {}) {
  if (!('Notification' in window)) {
    showToast(body, 'info');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/Spothitch/icon-192.png',
      badge: '/Spothitch/icon-96.png',
      data,
      vibrate: [100, 50, 100],
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (data.url) {
        window.location.href = data.url;
      }
    };
  } else {
    showToast(body, 'info');
  }
}

/**
 * Schedule a notification (if supported)
 */
export function scheduleNotification(title, body, triggerTime, data = {}) {
  const delay = triggerTime - Date.now();

  if (delay < 0) {
    console.warn('Notification time is in the past');
    return null;
  }

  const timeoutId = setTimeout(() => {
    sendLocalNotification(title, body, data);
  }, delay);

  return timeoutId;
}

// ==================== SPOT NOTIFICATIONS ====================

// Store subscribed spots in localStorage
const SPOT_SUBSCRIPTIONS_KEY = 'spothitch_spot_subscriptions';

/**
 * Get notification settings for spots
 */
export function getSpotNotificationSettings() {
  try {
    const saved = localStorage.getItem(SPOT_SUBSCRIPTIONS_KEY);
    return saved ? JSON.parse(saved) : { enabled: true, spots: [], types: ['checkin', 'rating', 'comment'] };
  } catch {
    return { enabled: true, spots: [], types: ['checkin', 'rating', 'comment'] };
  }
}

/**
 * Save notification settings for spots
 */
function saveSpotNotificationSettings(settings) {
  try {
    localStorage.setItem(SPOT_SUBSCRIPTIONS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save spot notification settings:', e);
  }
}

/**
 * Subscribe to notifications for a spot you created
 * @param {number|string} spotId - The spot ID
 * @param {string} spotName - The spot name for display
 */
export function subscribeToSpotNotifications(spotId, spotName) {
  const settings = getSpotNotificationSettings();

  if (!settings.spots.find(s => s.id === spotId)) {
    settings.spots.push({
      id: spotId,
      name: spotName,
      subscribedAt: new Date().toISOString()
    });
    saveSpotNotificationSettings(settings);
    showToast((t('notifSpotSubscribed') || 'Notifications activées pour "{name}"').replace('{name}', spotName), 'success');
  }

  return true;
}

/**
 * Unsubscribe from notifications for a spot
 * @param {number|string} spotId - The spot ID
 */
export function unsubscribeFromSpotNotifications(spotId) {
  const settings = getSpotNotificationSettings();
  settings.spots = settings.spots.filter(s => s.id !== spotId);
  saveSpotNotificationSettings(settings);
  showToast(t('notifSpotUnsubscribed') || 'Notifications désactivées pour ce spot', 'info');
}

/**
 * Check if subscribed to a spot's notifications
 * @param {number|string} spotId - The spot ID
 */
export function isSubscribedToSpot(spotId) {
  const settings = getSpotNotificationSettings();
  return settings.spots.some(s => s.id === spotId);
}

/**
 * Toggle spot notification subscription
 * @param {number|string} spotId - The spot ID
 * @param {string} spotName - The spot name for display
 */
export function toggleSpotNotifications(spotId, spotName) {
  if (isSubscribedToSpot(spotId)) {
    unsubscribeFromSpotNotifications(spotId);
    return false;
  } else {
    subscribeToSpotNotifications(spotId, spotName);
    return true;
  }
}

/**
 * Notify about activity on a spot
 * This is called when someone interacts with a spot you're subscribed to
 * @param {string} type - 'checkin' | 'rating' | 'comment'
 * @param {object} data - Activity data
 */
export function notifySpotActivity(type, data) {
  const settings = getSpotNotificationSettings();

  // Check if notifications are enabled and spot is subscribed
  if (!settings.enabled) return;
  if (!settings.types.includes(type)) return;

  const isSubscribed = settings.spots.some(s => s.id === data.spotId);
  if (!isSubscribed) return;

  const messages = {
    checkin: {
      title: '📍 Nouveau check-in !',
      body: `${data.userName || 'Un voyageur'} a validé ton spot "${data.spotName}"`,
    },
    rating: {
      title: '⭐ Nouvelle évaluation !',
      body: `${data.userName || 'Un voyageur'} a noté ton spot "${data.spotName}" : ${data.rating}/5`,
    },
    comment: {
      title: '💬 Nouveau commentaire !',
      body: `${data.userName || 'Un voyageur'} a commenté ton spot "${data.spotName}"`,
    },
  };

  const msg = messages[type];
  if (msg) {
    sendLocalNotification(msg.title, msg.body, {
      type: 'spot_activity',
      spotId: data.spotId,
      activityType: type,
      url: `/Spothitch/?spot=${data.spotId}`
    });

    // Also show in-app toast
    showToast(msg.body, 'info', 5000);
  }
}

/**
 * Get all subscribed spots
 */
export function getSubscribedSpots() {
  const settings = getSpotNotificationSettings();
  return settings.spots;
}

/**
 * Set notification types to receive
 * @param {string[]} types - Array of types: 'checkin', 'rating', 'comment'
 */
export function setSpotNotificationTypes(types) {
  const settings = getSpotNotificationSettings();
  settings.types = types;
  saveSpotNotificationSettings(settings);
}

/**
 * Toggle all spot notifications
 * @param {boolean} enabled - Enable or disable
 */
export function setSpotNotificationsEnabled(enabled) {
  const settings = getSpotNotificationSettings();
  settings.enabled = enabled;
  saveSpotNotificationSettings(settings);
  showToast(enabled ? (t('notifSpotEnabled') || 'Notifications de spots activées') : (t('notifSpotDisabled') || 'Notifications de spots désactivées'), 'info');
}

// ==================== NOTIFICATION PREFERENCES ====================

/**
 * Get notification preferences
 * @returns {Object} Notification preferences
 */
export function getNotificationPreferences() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return saved ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) } : { ...DEFAULT_NOTIFICATION_PREFS };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

/**
 * Save notification preferences
 * @param {Object} prefs - Preferences to save
 */
export function saveNotificationPreferences(prefs) {
  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save notification preferences:', e);
    return getNotificationPreferences();
  }
}

/**
 * Check if a notification type is enabled
 * @param {string} type - Notification type
 * @returns {boolean} Whether the notification is enabled
 */
export function isNotificationEnabled(type) {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return false;

  // Check quiet hours
  if (prefs.quietHoursEnabled) {
    const hour = new Date().getHours();
    const start = prefs.quietHoursStart;
    const end = prefs.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      if (hour >= start || hour < end) return false;
    } else {
      if (hour >= start && hour < end) return false;
    }
  }

  return prefs[type] !== false;
}

/**
 * Toggle a notification preference
 * @param {string} type - Notification type
 * @returns {boolean} New value
 */
export function toggleNotificationPreference(type) {
  const prefs = getNotificationPreferences();
  const newValue = !prefs[type];
  saveNotificationPreferences({ [type]: newValue });
  return newValue;
}

// ==================== SOCIAL NOTIFICATIONS ====================

/**
 * Notify when someone becomes a friend
 * @param {Object} friend - Friend data
 */
export function notifyNewFriend(friend) {
  if (!isNotificationEnabled('newFriend')) return;

  const title = t('notifNewFriendTitle') || 'Nouvel ami !';
  const body = (t('notifNewFriendBody') || '{name} a accepte ta demande d\'ami').replace('{name}', friend.name || (t('notifATraveler') || 'Un voyageur'));
  const icon = friend.avatar || '';

  sendLocalNotification(title, body, {
    type: 'new_friend',
    friendId: friend.id,
    url: '/Spothitch/?tab=social',
  });

  // Show in-app toast with emoji
  showToast(`${icon || ''} ${body}`, 'success', 5000);

  // Announce for screen readers
  announce((t('notifNewFriendAnnounce') || 'Nouvel ami: {name}').replace('{name}', friend.name || (t('notifATraveler') || 'Un voyageur')));
}

/**
 * Notify when receiving a new message
 * @param {Object} message - Message data
 */
export function notifyNewMessage(message) {
  if (!isNotificationEnabled('newMessage')) return;

  const senderName = message.senderName || (t('notifATraveler') || 'Un voyageur');
  const title = (t('notifNewMessageTitle') || 'Message de {name}').replace('{name}', senderName);
  const body = message.preview || message.text?.substring(0, 50) + '...' || (t('notifNewMessageBody') || 'Nouveau message');

  sendLocalNotification(title, body, {
    type: 'new_message',
    senderId: message.senderId,
    messageId: message.id,
    url: `/Spothitch/?tab=chat&friend=${message.senderId}`,
  });

  // Show in-app toast
  showToast(`${message.senderAvatar || ''} ${senderName}: "${body}"`, 'info', 4000);

  // Update unread count in state
  const state = getState();
  setState({
    unreadFriendMessages: (state.unreadFriendMessages || 0) + 1,
  });
}

/**
 * Notify when a friend is nearby
 * @param {Object} friend - Friend data with location
 * @param {number} distance - Distance in km
 */
export function notifyFriendNearby(friend, distance) {
  if (!isNotificationEnabled('friendNearby')) return;

  const prefs = getNotificationPreferences();
  if (distance > prefs.nearbyDistance) return;

  // Avoid duplicate notifications for the same friend
  const notifyKey = `nearby_${friend.id}`;
  const lastNotified = sessionStorage.getItem(notifyKey);
  const now = Date.now();

  // Only notify once per hour per friend
  if (lastNotified && now - parseInt(lastNotified) < 3600000) return;
  sessionStorage.setItem(notifyKey, now.toString());

  const title = t('notifFriendNearbyTitle') || 'Ami a proximite !';
  const distanceText = distance < 1
    ? (t('notifDistanceMeters') || 'a {n}m').replace('{n}', Math.round(distance * 1000))
    : (t('notifDistanceKm') || 'a {n}km').replace('{n}', distance.toFixed(1));
  const body = (t('notifFriendNearbyBody') || '{name} est {distance} de toi').replace('{name}', friend.name || (t('notifAFriend') || 'Un ami')).replace('{distance}', distanceText);

  sendLocalNotification(title, body, {
    type: 'friend_nearby',
    friendId: friend.id,
    distance,
    url: '/Spothitch/?tab=social&nearby=true',
  });

  // Show prominent in-app notification
  showToast(`${friend.avatar || ''} ${body}`, 'info', 8000);

  // Play sound if available
  if (window.playSound) {
    window.playSound('notification');
  }
}

// ==================== GAMIFICATION NOTIFICATIONS ====================

/**
 * Notify when a badge is unlocked
 * @param {Object} badge - Badge data
 */
export function notifyBadgeUnlocked(badge) {
  if (!isNotificationEnabled('badgeUnlocked')) return;

  const title = t('notifBadgeUnlockedTitle') || 'Badge debloque !';
  const body = (t('notifBadgeUnlockedBody') || 'Tu as obtenu le badge "{name}"').replace('{name}', badge.name);

  sendLocalNotification(title, body, {
    type: 'badge_unlocked',
    badgeId: badge.id,
    url: '/Spothitch/?tab=profile&badges=true',
  });

  // In-app notification is handled by gamification service
  // but we announce for accessibility
  announce((t('notifBadgeUnlockedAnnounce') || 'Badge debloque: {name}').replace('{name}', badge.name));
}

/**
 * Notify when leveling up
 * @param {number} newLevel - New level reached
 * @param {Object} rewards - Optional rewards for leveling up
 */
export function notifyLevelUp(newLevel, rewards = {}) {
  if (!isNotificationEnabled('levelUp')) return;

  const title = (t('notifLevelUpTitle') || 'Niveau {level} atteint !').replace('{level}', newLevel);
  let body = t('notifLevelUpBody') || 'Felicitations ! Continue comme ca !';

  if (rewards.points) {
    body += ` ${(t('notifLevelUpBonus') || '+{n} points bonus !').replace('{n}', rewards.points)}`;
  }
  if (rewards.title) {
    body = (t('notifLevelUpTitle2') || 'Nouveau titre: {name} !').replace('{name}', rewards.title.name);
  }

  sendLocalNotification(title, body, {
    type: 'level_up',
    level: newLevel,
    rewards,
    url: '/Spothitch/?tab=profile',
  });

  // Announce for accessibility
  announce((t('notifLevelUpAnnounce') || 'Niveau {level} atteint').replace('{level}', newLevel));
}

/**
 * Check and notify if streak is at risk
 * Called periodically to remind users
 */
export function checkStreakReminder() {
  if (!isNotificationEnabled('streakReminder')) return;

  const state = getState();
  const { streak, lastActiveDate } = state;

  if (!streak || streak < 2) return; // Only remind if they have a streak

  const today = new Date().toDateString();
  if (lastActiveDate === today) return; // Already active today

  const now = new Date();
  const hours = now.getHours();

  // Remind in the evening (18:00-21:00) if not active today
  if (hours >= 18 && hours < 21) {
    const title = t('notifStreakDangerTitle') || 'Ta serie est en danger !';
    const body = (t('notifStreakDangerBody') || '{n} jours de suite... Ne les perds pas ! Fais un check-in aujourd\'hui.').replace('{n}', streak);

    sendLocalNotification(title, body, {
      type: 'streak_reminder',
      streak,
      url: '/Spothitch/?tab=map',
    });

    showToast((t('notifStreakDangerToast') || 'Serie de {n} jours en danger ! Fais un check-in aujourd\'hui.').replace('{n}', streak), 'warning', 8000);
  }
}

/**
 * Start streak reminder checker
 */
export function startStreakReminderCheck() {
  if (streakCheckInterval) return;

  // Check immediately
  checkStreakReminder();

  // Then check every hour
  streakCheckInterval = setInterval(checkStreakReminder, 3600000);
}

/**
 * Stop streak reminder checker
 */
export function stopStreakReminderCheck() {
  if (streakCheckInterval) {
    clearInterval(streakCheckInterval);
    streakCheckInterval = null;
  }
}

// ==================== DAILY REWARD NOTIFICATION ====================

/**
 * Notify about daily reward available
 */
export function notifyDailyRewardAvailable() {
  if (!isNotificationEnabled('dailyReward')) return;

  const state = getState();
  const lastClaim = state.lastDailyRewardClaim;
  const today = new Date().toDateString();

  if (lastClaim === today) return; // Already claimed today

  const title = t('notifDailyRewardTitle') || 'Recompense quotidienne !';
  const body = t('notifDailyRewardBody') || 'Ta recompense quotidienne t\'attend ! Connecte-toi pour la recuperer.';

  sendLocalNotification(title, body, {
    type: 'daily_reward',
    url: '/Spothitch/',
  });

  showToast(t('notifDailyRewardToast') || 'Ta recompense quotidienne est disponible !', 'info', 5000);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate distance between two points in km (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check friends proximity and notify
 * @param {Array} friends - Array of friends with locations
 * @param {Object} userLocation - User's current location
 */
export function checkFriendsProximity(friends, userLocation) {
  if (!friends || !userLocation) return;

  const prefs = getNotificationPreferences();

  friends.forEach(friend => {
    if (friend.location) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        friend.location.lat,
        friend.location.lng
      );

      if (distance <= prefs.nearbyDistance) {
        notifyFriendNearby(friend, distance);
      }
    }
  });
}

/**
 * Cancel a scheduled notification
 * @param {string} id - Notification ID
 */
export function cancelScheduledNotification(id) {
  const timeoutId = scheduledNotifications.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledNotifications.delete(id);
  }
}

/**
 * Cancel all scheduled notifications
 */
export function cancelAllScheduledNotifications() {
  scheduledNotifications.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  scheduledNotifications.clear();
}

export default {
  initNotifications,
  showToast,
  showSuccess,
  showError,
  showFriendlyError,
  showInfo,
  showWarning,
  announce,
  sendLocalNotification,
  scheduleNotification,
  // Spot notifications
  getSpotNotificationSettings,
  subscribeToSpotNotifications,
  unsubscribeFromSpotNotifications,
  isSubscribedToSpot,
  toggleSpotNotifications,
  notifySpotActivity,
  getSubscribedSpots,
  setSpotNotificationTypes,
  setSpotNotificationsEnabled,
  // Notification preferences
  getNotificationPreferences,
  saveNotificationPreferences,
  isNotificationEnabled,
  toggleNotificationPreference,
  // Social notifications
  notifyNewFriend,
  notifyNewMessage,
  notifyFriendNearby,
  // Gamification notifications
  notifyBadgeUnlocked,
  notifyLevelUp,
  checkStreakReminder,
  startStreakReminderCheck,
  stopStreakReminderCheck,
  notifyDailyRewardAvailable,
  // Helper functions
  calculateDistance,
  checkFriendsProximity,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
};
