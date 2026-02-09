/**
 * Enhanced Notifications Service (#218-222, #224)
 * Advanced push notifications with actions, images, badges, and animations
 *
 * Features:
 * - Push notifications with actions (reply, view)
 * - Notifications with images
 * - Dynamic badges
 * - Friend request accepted notification (#219)
 * - New message notification with preview (#220)
 * - Badge unlocked notification with animation (#221)
 * - Level up celebration notification (#222)
 * - Friend nearby notification (#224)
 */

import { getState, setState } from '../stores/state.js'
import { t } from '../i18n/index.js'
import { escapeHTML } from '../utils/sanitize.js'

// ==================== NOTIFICATION TYPES ====================

export const NotificationType = {
  NEW_FRIEND: 'new_friend',
  NEW_MESSAGE: 'new_message',
  BADGE_UNLOCKED: 'badge_unlocked',
  LEVEL_UP: 'level_up',
  FRIEND_NEARBY: 'friend_nearby',
  SPOT_VALIDATED: 'spot_validated',
  FRIEND_NEW_SPOT: 'friend_new_spot',
  CHALLENGE_INVITE: 'challenge_invite',
  CHALLENGE_COMPLETED: 'challenge_completed',
  SPOT_ACTIVITY: 'spot_activity',
  DAILY_REWARD: 'daily_reward',
  STREAK_REMINDER: 'streak_reminder',
}

// ==================== NOTIFICATION SOUNDS ====================

const NotificationSounds = {
  [NotificationType.NEW_FRIEND]: 'friend',
  [NotificationType.NEW_MESSAGE]: 'message',
  [NotificationType.BADGE_UNLOCKED]: 'achievement',
  [NotificationType.LEVEL_UP]: 'levelup',
  [NotificationType.FRIEND_NEARBY]: 'nearby',
}

// ==================== STORAGE KEYS ====================

const NOTIFICATION_HISTORY_KEY = 'spothitch_notification_history'
const NOTIFICATION_SOUND_ENABLED_KEY = 'spothitch_notification_sound'
const NOTIFICATION_BADGE_COUNT_KEY = 'spothitch_badge_count'

// ==================== STATE ====================

let notificationHistory = []
let soundEnabled = true
let audioContext = null

// ==================== INITIALIZATION ====================

/**
 * Initialize enhanced notifications service
 */
export function initEnhancedNotifications() {
  // Load notification history
  loadNotificationHistory()

  // Load sound preference
  loadSoundPreference()

  // Initialize audio context on first user interaction
  if (typeof window !== 'undefined') {
    const initAudio = () => {
      if (!audioContext && typeof AudioContext !== 'undefined') {
        audioContext = new AudioContext()
      }
      document.removeEventListener('click', initAudio)
    }
    document.addEventListener('click', initAudio)
  }

  // Request notification permission if not granted
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      // Will be requested on user action
      console.log('[EnhancedNotifications] Permission will be requested on user action')
    }
  }

  return true
}

// ==================== NOTIFICATION HISTORY ====================

/**
 * Load notification history from localStorage
 */
function loadNotificationHistory() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_HISTORY_KEY)
    notificationHistory = saved ? JSON.parse(saved) : []
  } catch {
    notificationHistory = []
  }
}

/**
 * Save notification history to localStorage
 */
function saveNotificationHistory() {
  try {
    // Keep only last 100 notifications
    const toSave = notificationHistory.slice(0, 100)
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to save history:', e)
  }
}

/**
 * Add notification to history
 * @param {Object} notification - Notification data
 */
function addToHistory(notification) {
  const entry = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
  }
  notificationHistory.unshift(entry)
  saveNotificationHistory()
  return entry
}

/**
 * Get notification history
 * @param {number} limit - Max number of notifications to return
 * @returns {Array} Notification history
 */
export function getNotificationHistory(limit = 50) {
  return notificationHistory.slice(0, limit)
}

/**
 * Get unread notification count
 * @returns {number} Count of unread notifications
 */
export function getUnreadCount() {
  return notificationHistory.filter(n => !n.read).length
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export function markAsRead(notificationId) {
  const notification = notificationHistory.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
    saveNotificationHistory()
  }
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead() {
  notificationHistory.forEach(n => (n.read = true))
  saveNotificationHistory()
}

/**
 * Clear notification history
 */
export function clearNotificationHistory() {
  notificationHistory = []
  saveNotificationHistory()
}

// ==================== SOUND MANAGEMENT ====================

/**
 * Load sound preference
 */
function loadSoundPreference() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY)
    soundEnabled = saved !== 'false'
  } catch {
    soundEnabled = true
  }
}

/**
 * Set sound enabled/disabled
 * @param {boolean} enabled - Enable or disable sounds
 */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled
  try {
    localStorage.setItem(NOTIFICATION_SOUND_ENABLED_KEY, String(enabled))
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to save sound preference:', e)
  }
}

/**
 * Get sound enabled state
 * @returns {boolean} Whether sounds are enabled
 */
export function isSoundEnabled() {
  return soundEnabled
}

/**
 * Play notification sound
 * @param {string} type - Sound type (friend, message, achievement, levelup, nearby)
 */
export function playNotificationSound(type = 'default') {
  if (!soundEnabled) return

  // In a real app, you would load and play actual sound files
  // For now, we use Web Audio API to generate simple tones
  if (!audioContext) {
    if (typeof AudioContext !== 'undefined') {
      audioContext = new AudioContext()
    } else {
      return
    }
  }

  try {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different sounds for different notification types
    const soundConfig = {
      friend: { frequency: 523.25, duration: 0.15, type: 'sine' }, // C5
      message: { frequency: 659.25, duration: 0.1, type: 'sine' }, // E5
      achievement: { frequency: 783.99, duration: 0.3, type: 'triangle' }, // G5
      levelup: { frequency: 1046.5, duration: 0.5, type: 'square' }, // C6
      nearby: { frequency: 440, duration: 0.2, type: 'sine' }, // A4
      default: { frequency: 587.33, duration: 0.15, type: 'sine' }, // D5
    }

    const config = soundConfig[type] || soundConfig.default
    oscillator.type = config.type
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + config.duration)
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to play sound:', e)
  }
}

// ==================== BADGE COUNT ====================

/**
 * Update app badge count (PWA feature)
 * @param {number} count - Badge count
 */
export function updateBadgeCount(count) {
  // Save to localStorage
  try {
    localStorage.setItem(NOTIFICATION_BADGE_COUNT_KEY, String(count))
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to save badge count:', e)
  }

  // Update PWA badge if supported
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(e => {
        console.warn('[EnhancedNotifications] Failed to set app badge:', e)
      })
    } else {
      navigator.clearAppBadge().catch(e => {
        console.warn('[EnhancedNotifications] Failed to clear app badge:', e)
      })
    }
  }
}

/**
 * Get current badge count
 * @returns {number} Badge count
 */
export function getBadgeCount() {
  try {
    return parseInt(localStorage.getItem(NOTIFICATION_BADGE_COUNT_KEY) || '0', 10)
  } catch {
    return 0
  }
}

/**
 * Increment badge count
 */
export function incrementBadgeCount() {
  const current = getBadgeCount()
  updateBadgeCount(current + 1)
}

/**
 * Clear badge count
 */
export function clearBadgeCount() {
  updateBadgeCount(0)
}

// ==================== PUSH NOTIFICATION HELPERS ====================

/**
 * Request notification permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to request permission:', e)
    return false
  }
}

/**
 * Check if notifications are supported and permitted
 * @returns {boolean} Whether notifications are available
 */
export function isNotificationAvailable() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

/**
 * Create enhanced notification with actions and image
 * @param {Object} options - Notification options
 * @returns {Notification|null} The notification object or null
 */
export function createEnhancedNotification(options) {
  if (!isNotificationAvailable()) {
    // Fallback to toast notification
    showEnhancedToast(options)
    return null
  }

  const {
    title,
    body,
    icon = '/Spothitch/icon-192.png',
    image,
    badge = '/Spothitch/icon-96.png',
    tag,
    data = {},
    actions = [],
    requireInteraction = false,
    silent = false,
  } = options

  try {
    const notification = new Notification(title, {
      body,
      icon,
      image,
      badge,
      tag,
      data,
      actions,
      requireInteraction,
      silent,
      vibrate: [100, 50, 100],
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      if (data.url) {
        window.location.href = data.url
      }
      if (data.onClick && typeof data.onClick === 'function') {
        data.onClick()
      }
    }

    return notification
  } catch (e) {
    console.warn('[EnhancedNotifications] Failed to create notification:', e)
    showEnhancedToast(options)
    return null
  }
}

// ==================== TOAST NOTIFICATIONS ====================

let toastContainer = null

/**
 * Get or create toast container
 */
function getToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer
  }

  toastContainer = document.createElement('div')
  toastContainer.id = 'enhanced-toast-container'
  toastContainer.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    max-width: 90vw;
  `
  document.body.appendChild(toastContainer)
  return toastContainer
}

/**
 * Show enhanced toast notification
 * @param {Object} options - Toast options
 */
export function showEnhancedToast(options) {
  const container = getToastContainer()
  const {
    title,
    body,
    icon,
    image,
    type = 'info',
    duration = 5000,
    actions = [],
    onDismiss,
  } = options

  const toast = document.createElement('div')
  toast.className = `enhanced-toast enhanced-toast-${type}`
  toast.style.cssText = `
    background: var(--bg-secondary, #1f2937);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: slideInDown 0.3s ease-out;
    max-width: 400px;
    border-left: 4px solid ${getTypeColor(type)};
  `

  // Build toast content
  let content = ''

  if (icon) {
    content += `<div class="toast-icon" style="font-size: 24px; flex-shrink: 0;">${escapeHTML(icon)}</div>`
  }

  content += '<div class="toast-content" style="flex: 1; min-width: 0;">'

  if (title) {
    content += `<div class="toast-title" style="font-weight: 600; color: var(--text-primary, #fff); margin-bottom: 2px;">${escapeHTML(title)}</div>`
  }

  if (body) {
    content += `<div class="toast-body" style="color: var(--text-secondary, #9ca3af); font-size: 14px;">${escapeHTML(body)}</div>`
  }

  if (image) {
    content += `<img src="${escapeHTML(image)}" alt="" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" loading="lazy" />`
  }

  if (actions.length > 0) {
    content += '<div class="toast-actions" style="display: flex; gap: 8px; margin-top: 8px;">'
    actions.forEach((action, index) => {
      content += `<button class="toast-action" data-action-index="${index}" style="
        background: var(--primary-500, #10b981);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;
      ">${escapeHTML(action.label)}</button>`
    })
    content += '</div>'
  }

  content += '</div>'

  // Close button
  content += `<button class="toast-close" aria-label="${t('close')}" style="
    background: none;
    border: none;
    color: var(--text-secondary, #9ca3af);
    cursor: pointer;
    padding: 4px;
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
  ">&times;</button>`

  toast.innerHTML = content

  // Add event listeners
  const closeBtn = toast.querySelector('.toast-close')
  closeBtn.addEventListener('click', () => {
    dismissToast(toast, onDismiss)
  })

  // Action buttons
  const actionBtns = toast.querySelectorAll('.toast-action')
  actionBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (actions[index] && actions[index].action) {
        actions[index].action()
      }
      dismissToast(toast, onDismiss)
    })
  })

  container.appendChild(toast)

  // Auto dismiss
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast, onDismiss)
    }, duration)
  }

  return toast
}

/**
 * Get color for notification type
 * @param {string} type - Notification type
 * @returns {string} Color hex
 */
function getTypeColor(type) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    friend: '#8b5cf6',
    message: '#06b6d4',
    achievement: '#f59e0b',
    levelup: '#ec4899',
  }
  return colors[type] || colors.info
}

/**
 * Dismiss a toast
 * @param {HTMLElement} toast - Toast element
 * @param {Function} onDismiss - Callback
 */
function dismissToast(toast, onDismiss) {
  if (!toast || !toast.parentNode) return

  toast.style.animation = 'slideOutUp 0.3s ease-in forwards'
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
    if (onDismiss) onDismiss()
  }, 300)
}

// ==================== SPECIFIC NOTIFICATION FUNCTIONS ====================

/**
 * Send notification for new friend (#219)
 * @param {Object} friend - Friend data
 */
export function notifyNewFriendEnhanced(friend) {
  const { name, avatar, id } = friend

  const notification = {
    type: NotificationType.NEW_FRIEND,
    title: t('newFriendNotifTitle'),
    body: t('newFriendNotifBody', { name: name || t('anonymousUser') }),
    icon: avatar || '👋',
    data: {
      type: 'new_friend',
      friendId: id,
      url: '/Spothitch/?tab=social',
    },
    actions: [
      { label: t('viewProfile'), action: () => window.location.href = `/Spothitch/?tab=social&friend=${id}` },
      { label: t('sendMessage'), action: () => window.location.href = `/Spothitch/?tab=chat&friend=${id}` },
    ],
  }

  // Add to history
  addToHistory(notification)

  // Update badge count
  incrementBadgeCount()

  // Play sound
  playNotificationSound(NotificationSounds[NotificationType.NEW_FRIEND])

  // Show notification
  createEnhancedNotification(notification)
  showEnhancedToast({ ...notification, type: 'friend', duration: 6000 })

  return notification
}

/**
 * Send notification for new message (#220)
 * @param {Object} message - Message data
 */
export function notifyNewMessageEnhanced(message) {
  const { senderName, senderAvatar, senderId, text, preview } = message

  const messagePreview = preview || (text ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : '')

  const notification = {
    type: NotificationType.NEW_MESSAGE,
    title: t('newMessageNotifTitle', { sender: senderName || t('anonymousUser') }),
    body: messagePreview || t('newMessageNotifBody'),
    icon: senderAvatar || '💬',
    data: {
      type: 'new_message',
      senderId,
      url: `/Spothitch/?tab=chat&friend=${senderId}`,
    },
    actions: [
      { label: t('reply'), action: () => window.location.href = `/Spothitch/?tab=chat&friend=${senderId}` },
      { label: t('viewConversation'), action: () => window.location.href = `/Spothitch/?tab=chat&friend=${senderId}` },
    ],
  }

  // Add to history
  addToHistory(notification)

  // Update badge count
  incrementBadgeCount()

  // Update unread messages in state
  const state = getState()
  setState({ unreadFriendMessages: (state.unreadFriendMessages || 0) + 1 })

  // Play sound
  playNotificationSound(NotificationSounds[NotificationType.NEW_MESSAGE])

  // Show notification
  createEnhancedNotification(notification)
  showEnhancedToast({ ...notification, type: 'message', duration: 5000 })

  return notification
}

/**
 * Send notification for badge unlocked (#221)
 * @param {Object} badge - Badge data
 */
export function notifyBadgeUnlockedEnhanced(badge) {
  const { name, description, icon, rarity, points } = badge

  const rarityColors = {
    common: '#9ca3af',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  }

  const notification = {
    type: NotificationType.BADGE_UNLOCKED,
    title: t('badgeUnlockedNotifTitle'),
    body: t('badgeUnlockedNotifBody', { name: name || t('newBadge') }),
    icon: icon || '🏆',
    image: badge.image,
    data: {
      type: 'badge_unlocked',
      badgeId: badge.id,
      rarity,
      points,
      url: '/Spothitch/?tab=profile&badges=true',
    },
    actions: [
      { label: t('viewBadges'), action: () => window.location.href = '/Spothitch/?tab=profile&badges=true' },
      { label: t('share'), action: () => shareBadgeUnlock(badge) },
    ],
  }

  // Add to history
  addToHistory(notification)

  // Play sound (more epic for higher rarity)
  playNotificationSound(NotificationSounds[NotificationType.BADGE_UNLOCKED])

  // Show animated celebration toast
  showBadgeUnlockAnimation(badge)

  // Show notification
  createEnhancedNotification(notification)

  return notification
}

/**
 * Show animated badge unlock celebration
 * @param {Object} badge - Badge data
 */
export function showBadgeUnlockAnimation(badge) {
  const overlay = document.createElement('div')
  overlay.id = 'badge-unlock-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `

  const rarityColors = {
    common: '#9ca3af',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
    mythic: '#ec4899',
  }

  const rarityGlow = rarityColors[badge.rarity] || rarityColors.common

  overlay.innerHTML = `
    <div class="badge-celebration" style="text-align: center; animation: bounceIn 0.5s ease-out;">
      <div class="badge-icon" style="
        font-size: 80px;
        margin-bottom: 16px;
        filter: drop-shadow(0 0 20px ${rarityGlow});
        animation: pulse 1s ease-in-out infinite;
      ">${escapeHTML(badge.icon || '🏆')}</div>
      <div class="badge-title" style="
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 8px;
      ">${escapeHTML(t('badgeUnlockedNotifTitle'))}</div>
      <div class="badge-name" style="
        font-size: 20px;
        color: ${rarityGlow};
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 2px;
      ">${escapeHTML(badge.name || 'Badge')}</div>
      ${badge.description ? `<div class="badge-desc" style="
        font-size: 14px;
        color: #9ca3af;
        max-width: 300px;
        margin-bottom: 16px;
      ">${escapeHTML(badge.description)}</div>` : ''}
      ${badge.points ? `<div class="badge-points" style="
        font-size: 16px;
        color: #10b981;
        font-weight: 600;
      ">+${badge.points} ${t('points')}</div>` : ''}
    </div>
  `

  // Add CSS animations if not present
  addAnimationStyles()

  document.body.appendChild(overlay)

  // Click to dismiss
  overlay.addEventListener('click', () => {
    overlay.style.animation = 'fadeOut 0.3s ease-in forwards'
    setTimeout(() => overlay.remove(), 300)
  })

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.style.animation = 'fadeOut 0.3s ease-in forwards'
      setTimeout(() => overlay.remove(), 300)
    }
  }, 4000)
}

/**
 * Send notification for level up (#222)
 * @param {number} newLevel - New level
 * @param {Object} rewards - Rewards for leveling up
 */
export function notifyLevelUpEnhanced(newLevel, rewards = {}) {
  const { points, title: newTitle, unlocks = [] } = rewards

  let body = t('levelUpNotifBody', { level: newLevel })
  if (points) {
    body += ` +${points} ${t('points')}!`
  }
  if (newTitle) {
    body = t('levelUpNewTitle', { title: newTitle.name })
  }

  const notification = {
    type: NotificationType.LEVEL_UP,
    title: t('levelUpNotifTitle', { level: newLevel }),
    body,
    icon: '⭐',
    data: {
      type: 'level_up',
      level: newLevel,
      rewards,
      url: '/Spothitch/?tab=profile',
    },
    actions: [
      { label: t('viewProfile'), action: () => window.location.href = '/Spothitch/?tab=profile' },
    ],
  }

  // Add unlocks info
  if (unlocks.length > 0) {
    notification.body += ` ${t('newUnlocks')}: ${unlocks.join(', ')}`
  }

  // Add to history
  addToHistory(notification)

  // Play sound
  playNotificationSound(NotificationSounds[NotificationType.LEVEL_UP])

  // Show level up celebration
  showLevelUpAnimation(newLevel, rewards)

  // Show notification
  createEnhancedNotification(notification)

  return notification
}

/**
 * Show animated level up celebration
 * @param {number} level - New level
 * @param {Object} rewards - Rewards
 */
export function showLevelUpAnimation(level, rewards = {}) {
  const overlay = document.createElement('div')
  overlay.id = 'levelup-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `

  overlay.innerHTML = `
    <div class="levelup-celebration" style="text-align: center;">
      <div class="levelup-stars" style="
        font-size: 40px;
        margin-bottom: 16px;
        animation: sparkle 1s ease-in-out infinite;
      ">⭐ ⭐ ⭐</div>
      <div class="levelup-title" style="
        font-size: 18px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 4px;
        margin-bottom: 8px;
      ">${escapeHTML(t('levelUp'))}</div>
      <div class="levelup-number" style="
        font-size: 80px;
        font-weight: bold;
        color: #f59e0b;
        text-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
        animation: scaleIn 0.5s ease-out;
      ">${level}</div>
      ${rewards.points ? `<div class="levelup-points" style="
        font-size: 20px;
        color: #10b981;
        margin-top: 16px;
        font-weight: 600;
      ">+${rewards.points} ${t('points')}</div>` : ''}
      ${rewards.title ? `<div class="levelup-newtitle" style="
        font-size: 16px;
        color: #8b5cf6;
        margin-top: 8px;
      ">${escapeHTML(t('newTitle'))}: ${escapeHTML(rewards.title.name)}</div>` : ''}
      ${rewards.unlocks && rewards.unlocks.length > 0 ? `<div class="levelup-unlocks" style="
        font-size: 14px;
        color: #3b82f6;
        margin-top: 12px;
      ">${escapeHTML(t('newUnlocks'))}: ${escapeHTML(rewards.unlocks.join(', '))}</div>` : ''}
    </div>
  `

  // Add CSS animations if not present
  addAnimationStyles()

  // Add confetti effect
  addConfetti(overlay)

  document.body.appendChild(overlay)

  // Click to dismiss
  overlay.addEventListener('click', () => {
    overlay.style.animation = 'fadeOut 0.3s ease-in forwards'
    setTimeout(() => overlay.remove(), 300)
  })

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.style.animation = 'fadeOut 0.3s ease-in forwards'
      setTimeout(() => overlay.remove(), 300)
    }
  }, 5000)
}

/**
 * Add confetti particles to an element
 * @param {HTMLElement} container - Container element
 */
function addConfetti(container) {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6']

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div')
    confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${50 + (Math.random() - 0.5) * 40}%;
      top: 30%;
      opacity: 0;
      animation: confettiFall ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards;
      transform: rotate(${Math.random() * 360}deg);
    `
    container.appendChild(confetti)
  }
}

/**
 * Send notification for friend nearby (#224)
 * @param {Object} friend - Friend data
 * @param {number} distance - Distance in km
 */
export function notifyFriendNearbyEnhanced(friend, distance) {
  const { name, avatar, id, location } = friend

  const distanceText = distance < 1
    ? `${Math.round(distance * 1000)}m`
    : `${distance.toFixed(1)}km`

  const notification = {
    type: NotificationType.FRIEND_NEARBY,
    title: t('friendNearbyNotifTitle'),
    body: t('friendNearbyNotifBody', { name: name || t('anonymousUser'), distance: distanceText }),
    icon: avatar || '📍',
    data: {
      type: 'friend_nearby',
      friendId: id,
      distance,
      location,
      url: '/Spothitch/?tab=map',
    },
    actions: [
      { label: t('viewOnMap'), action: () => window.location.href = '/Spothitch/?tab=map' },
      { label: t('sendMessage'), action: () => window.location.href = `/Spothitch/?tab=chat&friend=${id}` },
    ],
  }

  // Avoid duplicate notifications for same friend within 1 hour
  const cacheKey = `nearby_${id}`
  const lastNotified = sessionStorage.getItem(cacheKey)
  const now = Date.now()

  if (lastNotified && now - parseInt(lastNotified) < 3600000) {
    return null
  }
  sessionStorage.setItem(cacheKey, now.toString())

  // Add to history
  addToHistory(notification)

  // Play sound
  playNotificationSound(NotificationSounds[NotificationType.FRIEND_NEARBY])

  // Show notification
  createEnhancedNotification(notification)
  showEnhancedToast({ ...notification, type: 'friend', duration: 8000 })

  return notification
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Share badge unlock (for social sharing)
 * @param {Object} badge - Badge data
 */
async function shareBadgeUnlock(badge) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: t('shareAchievementTitle', { name: badge.name }),
        text: t('shareAchievementText', { name: badge.name, description: badge.description || '' }),
        url: window.location.origin + '/Spothitch/',
      })
    } catch (e) {
      console.warn('[EnhancedNotifications] Share failed:', e)
    }
  }
}

/**
 * Add animation styles to document
 */
function addAnimationStyles() {
  if (document.getElementById('enhanced-notification-styles')) return

  const style = document.createElement('style')
  style.id = 'enhanced-notification-styles'
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideOutUp {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3); }
      50% { opacity: 1; transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    @keyframes sparkle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes confettiFall {
      0% { opacity: 1; transform: translateY(0) rotate(0deg); }
      100% { opacity: 0; transform: translateY(300px) rotate(720deg); }
    }
  `
  document.head.appendChild(style)
}

// ==================== SOCIAL SPOT NOTIFICATIONS ====================

/**
 * Notify when someone validates one of our spots
 * @param {Object} data - { validatorName, validatorAvatar, spotName, spotId }
 */
export function notifySpotValidated(data) {
  const { validatorName, validatorAvatar, spotName, spotId } = data

  const notification = {
    type: NotificationType.SPOT_VALIDATED,
    title: '✅ Spot validé !',
    body: `${validatorName || 'Un voyageur'} a validé ton spot "${spotName || 'Spot'}"`,
    icon: validatorAvatar || '✅',
    data: {
      type: 'spot_validated',
      spotId,
      url: `/Spothitch/?tab=map&spot=${spotId}`,
    },
    actions: [
      { label: 'Voir le spot', action: () => window.openSpotDetail?.(spotId) },
    ],
  }

  addToHistory(notification)
  incrementBadgeCount()
  createEnhancedNotification(notification)
  showEnhancedToast({ ...notification, type: 'success', duration: 5000 })

  return notification
}

/**
 * Notify when a friend creates a new spot
 * @param {Object} data - { friendName, friendAvatar, friendId, spotName, spotId, spotCity }
 */
export function notifyFriendNewSpot(data) {
  const { friendName, friendAvatar, friendId, spotName, spotId, spotCity } = data

  const notification = {
    type: NotificationType.FRIEND_NEW_SPOT,
    title: `📍 ${friendName || 'Un ami'} a ajouté un spot`,
    body: spotCity ? `"${spotName}" à ${spotCity}` : `"${spotName || 'Nouveau spot'}"`,
    icon: friendAvatar || '📍',
    data: {
      type: 'friend_new_spot',
      friendId,
      spotId,
      url: `/Spothitch/?tab=map&spot=${spotId}`,
    },
    actions: [
      { label: 'Voir le spot', action: () => window.openSpotDetail?.(spotId) },
      { label: 'Voir profil', action: () => window.showFriendProfile?.(friendId) },
    ],
  }

  addToHistory(notification)
  incrementBadgeCount()
  playNotificationSound(NotificationSounds[NotificationType.NEW_FRIEND])
  createEnhancedNotification(notification)
  showEnhancedToast({ ...notification, type: 'info', duration: 6000 })

  return notification
}

// ==================== EXPORTS ====================

export default {
  // Initialization
  initEnhancedNotifications,

  // Notification types
  NotificationType,

  // History
  getNotificationHistory,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotificationHistory,

  // Sound
  setSoundEnabled,
  isSoundEnabled,
  playNotificationSound,

  // Badge count
  updateBadgeCount,
  getBadgeCount,
  incrementBadgeCount,
  clearBadgeCount,

  // Permission
  requestNotificationPermission,
  isNotificationAvailable,

  // Core notification functions
  createEnhancedNotification,
  showEnhancedToast,

  // Specific notifications
  notifyNewFriendEnhanced,
  notifyNewMessageEnhanced,
  notifyBadgeUnlockedEnhanced,
  notifyLevelUpEnhanced,
  notifyFriendNearbyEnhanced,
  notifySpotValidated,
  notifyFriendNewSpot,

  // Animations
  showBadgeUnlockAnimation,
  showLevelUpAnimation,
}
