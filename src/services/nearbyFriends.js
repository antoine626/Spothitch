/**
 * Nearby Friends Service
 * Detect and notify when friends are nearby
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Configuration
const CONFIG = {
  defaultRadius: 50, // km
  updateInterval: 5 * 60 * 1000, // 5 minutes
  proximityThresholds: [
    { distance: 5, label: () => t('nearbyFriendsVeryClose') || 'très proche', priority: 'high', icon: 'fa-location-arrow' },
    { distance: 20, label: () => t('nearbyFriendsClose') || 'proche', priority: 'medium', icon: 'fa-map-marker-alt' },
    { distance: 50, label: () => t('nearbyFriendsNearby') || 'dans les environs', priority: 'low', icon: 'fa-map-pin' },
  ],
};

// State
let locationWatchId = null;
let checkInterval = null;
const lastNotifiedFriends = new Map(); // friendId -> timestamp
let userLocation = null;

/**
 * Initialize nearby friends tracking
 */
export function initNearbyFriendsTracking() {
  const state = getState();

  // Check if feature is enabled
  if (!state.nearbyFriendsEnabled) {
    return;
  }

  // Start location tracking
  startLocationTracking();

  // Set up periodic checks
  checkInterval = setInterval(checkNearbyFriends, CONFIG.updateInterval);
}

/**
 * Stop nearby friends tracking
 */
export function stopNearbyFriendsTracking() {
  if (locationWatchId) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

}

/**
 * Start location tracking
 */
function startLocationTracking() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not available');
    return;
  }

  locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };

      // Update state for sharing with friends
      updateSharedLocation(userLocation);

      // Check for nearby friends
      checkNearbyFriends();
    },
    (error) => {
      console.warn('Location error:', error);
    },
    {
      enableHighAccuracy: false,
      maximumAge: 5 * 60 * 1000, // 5 minutes
      timeout: 30000,
    }
  );
}

/**
 * Update shared location (for friends to see)
 * @param {Object} location
 */
function updateSharedLocation(location) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId || !state.shareLocationWithFriends) return;

  // In production, this would update Firebase
  setState({
    mySharedLocation: {
      ...location,
      userId,
      username: state.username,
      avatar: state.avatar,
      lastUpdate: Date.now(),
    },
  });
}

/**
 * Check for nearby friends
 */
export function checkNearbyFriends() {
  if (!userLocation) return;

  const state = getState();
  const friends = state.friends || [];
  const friendsLocations = state.friendsLocations || [];
  const notificationRadius = state.nearbyFriendsRadius || CONFIG.defaultRadius;

  const nearbyFriends = [];

  for (const friendLoc of friendsLocations) {
    // Skip if no location or too old (> 1 hour)
    if (!friendLoc.lat || !friendLoc.lng) continue;
    if (Date.now() - friendLoc.lastUpdate > 60 * 60 * 1000) continue;

    // Calculate distance
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      friendLoc.lat,
      friendLoc.lng
    );

    if (distance <= notificationRadius) {
      nearbyFriends.push({
        ...friendLoc,
        distance: Math.round(distance * 10) / 10,
      });
    }
  }

  // Sort by distance
  nearbyFriends.sort((a, b) => a.distance - b.distance);

  // Update state
  setState({ nearbyFriends });

  // Send notifications for new nearby friends
  notifyNearbyFriends(nearbyFriends);
}

/**
 * Notify about nearby friends
 * @param {Array} nearbyFriends
 */
function notifyNearbyFriends(nearbyFriends) {
  const now = Date.now();
  const cooldownPeriod = 30 * 60 * 1000; // 30 minutes

  for (const friend of nearbyFriends) {
    // Check cooldown
    const lastNotified = lastNotifiedFriends.get(friend.userId);
    if (lastNotified && now - lastNotified < cooldownPeriod) {
      continue;
    }

    // Get proximity info
    const proximity = CONFIG.proximityThresholds.find(
      (t) => friend.distance <= t.distance
    );

    if (proximity) {
      // Show notification
      showNearbyFriendNotification(friend, proximity);

      // Update cooldown
      lastNotifiedFriends.set(friend.userId, now);
    }
  }
}

/**
 * Show nearby friend notification
 * @param {Object} friend
 * @param {Object} proximity
 */
function showNearbyFriendNotification(friend, proximity) {
  // Toast notification
  const proximityLabel = typeof proximity.label === 'function' ? proximity.label() : proximity.label;
  showToast(
    `📍 ${friend.username} ${t('nearbyFriendsIs') || 'est'} ${proximityLabel} (${friend.distance}km)`,
    'info'
  );

  // Push notification if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(t('nearbyFriendsNotifTitle') || 'Ami proche !', {
      body: `${friend.username} ${t('nearbyFriendsIs') || 'est'} ${proximityLabel} (${friend.distance}km)`,
      icon: '/icon-192.png',
      tag: `nearby_${friend.userId}`,
    });
  }

  // Update state for UI display
  const state = getState();
  const notifications = state.nearbyNotifications || [];
  notifications.unshift({
    id: `nearby_${Date.now()}`,
    friendId: friend.userId,
    friendName: friend.username,
    friendAvatar: friend.avatar,
    distance: friend.distance,
    proximity: proximity.label,
    timestamp: Date.now(),
    read: false,
  });

  // Keep only last 10 notifications
  setState({
    nearbyNotifications: notifications.slice(0, 10),
  });
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Toggle nearby friends feature
 * @param {boolean} enabled
 */
export function toggleNearbyFriends(enabled) {
  setState({ nearbyFriendsEnabled: enabled });

  if (enabled) {
    initNearbyFriendsTracking();
    showToast(t('nearbyFriendsEnabled') || 'Notifications d\'amis proches activées', 'success');
  } else {
    stopNearbyFriendsTracking();
    showToast(t('nearbyFriendsDisabled') || 'Notifications d\'amis proches désactivées', 'info');
  }
}

/**
 * Update notification radius
 * @param {number} radius - Radius in km
 */
export function setNotificationRadius(radius) {
  setState({ nearbyFriendsRadius: radius });
  showToast(`${t('nearbyFriendsRadius') || 'Rayon de notification'}: ${radius}km`, 'info');
}

/**
 * Mark notification as read
 * @param {string} notificationId
 */
export function markNotificationRead(notificationId) {
  const state = getState();
  const notifications = state.nearbyNotifications || [];

  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );

  setState({ nearbyNotifications: updated });
}

/**
 * Get unread notification count
 * @returns {number}
 */
export function getUnreadCount() {
  const state = getState();
  const notifications = state.nearbyNotifications || [];
  return notifications.filter((n) => !n.read).length;
}

/**
 * Render nearby friends widget
 * @param {Object} state
 * @returns {string}
 */
export function renderNearbyFriendsWidget(state) {
  const nearbyFriends = state.nearbyFriends || [];
  const isEnabled = state.nearbyFriendsEnabled;

  if (!isEnabled || nearbyFriends.length === 0) return '';

  return `
    <div class="nearby-friends-widget fixed bottom-24 right-4 z-40">
      <button
        onclick="toggleNearbyFriendsList()"
        class="relative p-3 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-all"
        aria-label="${t('nearbyFriendsLabel') || 'Amis proches'} (${nearbyFriends.length})"
      >
        ${icon('user-friends', 'w-5 h-5')}
        <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-xs flex items-center justify-center font-bold">
          ${nearbyFriends.length}
        </span>
      </button>
    </div>
  `;
}

/**
 * Render nearby friends list
 * @param {Object} state
 * @returns {string}
 */
export function renderNearbyFriendsList(state) {
  if (!state.showNearbyFriends) return '';

  const nearbyFriends = state.nearbyFriends || [];

  return `
    <div
      class="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onclick="if(event.target===this)closeNearbyFriendsList()"
    >
      <div class="bg-dark-card w-full max-w-md rounded-t-3xl max-h-[70vh] overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 class="font-bold text-lg">${t('nearbyFriendsTitle') || 'Amis proches'}</h2>
            <p class="text-sm text-slate-400">${nearbyFriends.length} ${nearbyFriends.length > 1 ? (t('nearbyFriendsFriends') || 'amis') : (t('nearbyFriendsFriend') || 'ami')} ${t('nearbyFriendsNearbyText') || 'à proximité'}</p>
          </div>
          <button
            onclick="closeNearbyFriendsList()"
            class="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="${t('close') || 'Fermer'}"
          >
            ${icon('times', 'w-5 h-5')}
          </button>
        </div>

        <!-- List -->
        <div class="overflow-y-auto max-h-[50vh]">
          ${nearbyFriends.length > 0 ? `
            <div class="p-4 space-y-3">
              ${nearbyFriends.map((friend) => {
    const proximity = CONFIG.proximityThresholds.find(
      (t) => friend.distance <= t.distance
    ) || CONFIG.proximityThresholds[2];

    return `
                  <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-xl">
                      ${friend.avatar || '👤'}
                    </div>
                    <div class="flex-1">
                      <div class="font-medium">${friend.username}</div>
                      <div class="text-sm text-slate-400 flex items-center gap-2">
                        ${icon(proximity.icon, 'w-5 h-5')}
                        <span>${friend.distance}km - ${proximity.label}</span>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        onclick="openFriendChat('${friend.userId}')"
                        class="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                        aria-label="${t('sendMessage') || 'Envoyer un message'}"
                      >
                        ${icon('comment', 'w-5 h-5')}
                      </button>
                      <button
                        onclick="showFriendOnMap('${friend.userId}')"
                        class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        aria-label="${t('showOnMap') || 'Voir sur la carte'}"
                      >
                        ${icon('map-marker-alt', 'w-5 h-5')}
                      </button>
                    </div>
                  </div>
                `;
  }).join('')}
            </div>
          ` : `
            <div class="p-8 text-center text-slate-400">
              ${icon('user-friends', 'w-8 h-8 mb-2')}
              <p>${t('nearbyFriendsEmpty') || 'Aucun ami à proximité'}</p>
            </div>
          `}
        </div>

        <!-- Settings -->
        <div class="p-4 border-t border-white/10">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-slate-400">${t('nearbyFriendsRadius') || 'Rayon de notification'}</span>
            <select
              onchange="setNotificationRadius(Number(this.value))"
              class="bg-white/10 rounded-lg px-3 py-1 text-sm"
            >
              <option value="10" ${state.nearbyFriendsRadius === 10 ? 'selected' : ''}>10 km</option>
              <option value="25" ${state.nearbyFriendsRadius === 25 ? 'selected' : ''}>25 km</option>
              <option value="50" ${state.nearbyFriendsRadius === 50 || !state.nearbyFriendsRadius ? 'selected' : ''}>50 km</option>
              <option value="100" ${state.nearbyFriendsRadius === 100 ? 'selected' : ''}>100 km</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">${t('nearbyFriendsShareLocation') || 'Partager ma position'}</span>
            <button
              onclick="toggleLocationSharing()"
              class="w-12 h-6 rounded-full transition-colors ${state.shareLocationWithFriends ? 'bg-primary-500' : 'bg-white/20'}"
            >
              <div class="w-5 h-5 rounded-full bg-white shadow transition-transform ${state.shareLocationWithFriends ? 'translate-x-6' : 'translate-x-0.5'}"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render settings section for nearby friends
 * @param {Object} state
 * @returns {string}
 */
export function renderNearbyFriendsSettings(state) {
  return `
    <div class="bg-dark-card rounded-xl p-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          ${icon('user-friends', 'w-5 h-5 text-primary-400')}
        </div>
        <div>
          <h3 class="font-semibold">Amis proches</h3>
          <p class="text-xs text-slate-400">Reçois une notification quand un ami est proche</p>
        </div>
        <button
          onclick="toggleNearbyFriends(!${state.nearbyFriendsEnabled})"
          class="ml-auto w-12 h-6 rounded-full transition-colors ${state.nearbyFriendsEnabled ? 'bg-primary-500' : 'bg-white/20'}"
        >
          <div class="w-5 h-5 rounded-full bg-white shadow transition-transform ${state.nearbyFriendsEnabled ? 'translate-x-6' : 'translate-x-0.5'}"></div>
        </button>
      </div>

      ${state.nearbyFriendsEnabled ? `
        <div class="space-y-3 pl-13">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">Rayon de notification</span>
            <select
              onchange="setNotificationRadius(Number(this.value))"
              class="bg-white/10 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="10" ${state.nearbyFriendsRadius === 10 ? 'selected' : ''}>10 km</option>
              <option value="25" ${state.nearbyFriendsRadius === 25 ? 'selected' : ''}>25 km</option>
              <option value="50" ${state.nearbyFriendsRadius === 50 || !state.nearbyFriendsRadius ? 'selected' : ''}>50 km</option>
              <option value="100" ${state.nearbyFriendsRadius === 100 ? 'selected' : ''}>100 km</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">${t('nearbyFriendsShareLocation') || 'Partager ma position'}</span>
            <button
              onclick="toggleLocationSharing()"
              class="w-10 h-5 rounded-full transition-colors ${state.shareLocationWithFriends ? 'bg-primary-500' : 'bg-white/20'}"
            >
              <div class="w-4 h-4 rounded-full bg-white shadow transition-transform ${state.shareLocationWithFriends ? 'translate-x-5' : 'translate-x-0.5'}"></div>
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Global handlers
window.toggleNearbyFriends = toggleNearbyFriends;
window.setNotificationRadius = setNotificationRadius;
window.toggleNearbyFriendsList = () => {
  const state = getState();
  setState({ showNearbyFriends: !state.showNearbyFriends });
};
window.closeNearbyFriendsList = () => setState({ showNearbyFriends: false });
window.toggleLocationSharing = () => {
  const state = getState();
  setState({ shareLocationWithFriends: !state.shareLocationWithFriends });
  showToast(
    state.shareLocationWithFriends
      ? 'Partage de position désactivé'
      : 'Partage de position activé',
    'info'
  );
};
window.showFriendOnMap = (friendId) => {
  const state = getState();
  const friendsLocations = state.friendsLocations || [];
  const friend = friendsLocations.find((f) => f.userId === friendId);
  if (friend) {
    setState({
      showNearbyFriends: false,
      activeTab: 'spots',
      viewMode: 'map',
      mapCenter: { lat: friend.lat, lng: friend.lng },
    });
  }
};

export default {
  initNearbyFriendsTracking,
  stopNearbyFriendsTracking,
  checkNearbyFriends,
  toggleNearbyFriends,
  setNotificationRadius,
  markNotificationRead,
  getUnreadCount,
  renderNearbyFriendsWidget,
  renderNearbyFriendsList,
  renderNearbyFriendsSettings,
};
