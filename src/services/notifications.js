/**
 * Notifications Service
 * Handles push notifications and in-app toasts
 */

import { requestNotificationPermission, onForegroundMessage } from './firebase.js';
import { escapeHTML } from '../utils/sanitize.js';

// Toast container reference
let toastContainer = null;

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
 */
export function showError(message, duration) {
  showToast(message, 'error', duration);
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
    showToast(`Notifications activées pour "${spotName}"`, 'success');
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
  showToast('Notifications désactivées pour ce spot', 'info');
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
  showToast(enabled ? 'Notifications de spots activées' : 'Notifications de spots désactivées', 'info');
}

export default {
  initNotifications,
  showToast,
  showSuccess,
  showError,
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
};
