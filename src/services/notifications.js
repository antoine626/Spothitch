/**
 * Notifications Service
 * Handles push notifications and in-app toasts
 */

import { requestNotificationPermission, onForegroundMessage } from './firebase.js';

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
    <span>${message}</span>
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
};
