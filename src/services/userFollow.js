/**
 * User Follow Service
 * Feature #197 - Service pour suivre des utilisateurs
 *
 * Permet de suivre des utilisateurs SEULEMENT si leur profil est PUBLIC.
 * Gestion des followers/following avec notifications et stockage local.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage keys
const FOLLOWERS_KEY = 'spothitch_followers';
const FOLLOWING_KEY = 'spothitch_following';
const PROFILE_VISIBILITY_KEY = 'spothitch_profile_visibility';
const USER_PROFILES_KEY = 'spothitch_user_profiles';

/**
 * Profile visibility enum
 */
export const ProfileVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

/**
 * Follow relationship status enum
 */
export const FollowStatus = {
  ACTIVE: 'active',
  PENDING: 'pending', // For potential future approval system
  BLOCKED: 'blocked',
};

/**
 * Get followers from storage
 * @returns {Array} Array of follower objects
 */
function getFollowersFromStorage() {
  try {
    const data = Storage.get(FOLLOWERS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[UserFollow] Error reading followers:', error);
    return [];
  }
}

/**
 * Save followers to storage
 * @param {Array} followers - Array of follower objects
 */
function saveFollowersToStorage(followers) {
  try {
    Storage.set(FOLLOWERS_KEY, followers);
  } catch (error) {
    console.error('[UserFollow] Error saving followers:', error);
  }
}

/**
 * Get following from storage
 * @returns {Array} Array of following objects
 */
function getFollowingFromStorage() {
  try {
    const data = Storage.get(FOLLOWING_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[UserFollow] Error reading following:', error);
    return [];
  }
}

/**
 * Save following to storage
 * @param {Array} following - Array of following objects
 */
function saveFollowingToStorage(following) {
  try {
    Storage.set(FOLLOWING_KEY, following);
  } catch (error) {
    console.error('[UserFollow] Error saving following:', error);
  }
}

/**
 * Get user profiles cache from storage
 * @returns {Object} User profiles cache
 */
function getUserProfilesFromStorage() {
  try {
    const data = Storage.get(USER_PROFILES_KEY);
    return data && typeof data === 'object' ? data : {};
  } catch (error) {
    console.error('[UserFollow] Error reading user profiles:', error);
    return {};
  }
}

/**
 * Save user profiles cache to storage
 * @param {Object} profiles - User profiles cache
 */
function saveUserProfilesToStorage(profiles) {
  try {
    Storage.set(USER_PROFILES_KEY, profiles);
  } catch (error) {
    console.error('[UserFollow] Error saving user profiles:', error);
  }
}

/**
 * Cache a user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 */
function cacheUserProfile(userId, profileData) {
  const profiles = getUserProfilesFromStorage();
  profiles[userId] = {
    ...profileData,
    cachedAt: new Date().toISOString(),
  };
  saveUserProfilesToStorage(profiles);
}

/**
 * Get cached user profile
 * @param {string} userId - User ID
 * @returns {Object|null} Profile data or null
 */
function getCachedUserProfile(userId) {
  const profiles = getUserProfilesFromStorage();
  return profiles[userId] || null;
}

/**
 * Get current user's profile visibility setting
 * @returns {string} 'public' or 'private'
 */
export function getProfileVisibility() {
  try {
    const visibility = Storage.get(PROFILE_VISIBILITY_KEY);
    return visibility === ProfileVisibility.PRIVATE
      ? ProfileVisibility.PRIVATE
      : ProfileVisibility.PUBLIC; // Default to private for safety
  } catch (error) {
    console.error('[UserFollow] Error reading profile visibility:', error);
    return ProfileVisibility.PRIVATE;
  }
}

/**
 * Set current user's profile visibility
 * @param {string} visibility - 'public' or 'private'
 * @returns {Object} Result object
 */
export function setProfileVisibility(visibility) {
  if (visibility !== ProfileVisibility.PUBLIC && visibility !== ProfileVisibility.PRIVATE) {
    return { success: false, error: 'invalid_visibility' };
  }

  try {
    Storage.set(PROFILE_VISIBILITY_KEY, visibility);

    const message = visibility === ProfileVisibility.PUBLIC
      ? t('profileNowPublic') || 'Ton profil est maintenant public. Les autres peuvent te suivre.'
      : t('profileNowPrivate') || 'Ton profil est maintenant prive. Personne ne peut te suivre.';

    showToast(message, visibility === ProfileVisibility.PUBLIC ? 'success' : 'info');

    return { success: true, visibility };
  } catch (error) {
    console.error('[UserFollow] Error setting profile visibility:', error);
    return { success: false, error: 'storage_error' };
  }
}

/**
 * Check if a user's profile is public
 * @param {string} userId - User ID to check
 * @returns {boolean} True if profile is public
 */
export function isProfilePublic(userId) {
  if (!userId) return false;

  const state = getState();
  const currentUserId = state.user?.uid;

  // If checking own profile, use stored visibility
  if (currentUserId && userId === currentUserId) {
    return getProfileVisibility() === ProfileVisibility.PUBLIC;
  }

  // For other users, check cached profile or assume private
  const cachedProfile = getCachedUserProfile(userId);
  if (cachedProfile) {
    return cachedProfile.visibility === ProfileVisibility.PUBLIC;
  }

  // In demo mode, simulate some profiles as public
  // In production, this would query the backend
  const demoPublicUsers = ['user_demo1', 'user_demo2', 'marie_paris', 'thomas_berlin', 'elena_barcelona'];
  return demoPublicUsers.includes(userId);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format relative time (e.g., "il y a 2 heures")
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow') || 'A l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

/**
 * Notify user when someone follows them
 * @param {Object} follower - Follower data
 */
function notifyNewFollower(follower) {
  const message = `${follower.username || follower.id} ${t('nowFollowsYou') || 'te suit maintenant !'}`;
  showToast(message, 'success');

  // Also trigger a local notification if available
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(t('newFollower') || 'Nouveau follower !', {
        body: message,
        icon: '/Spothitch/icon-192.png',
      });
    } catch (e) {
      // Notification API might not be available
    }
  }
}

/**
 * Follow a user
 * @param {string} userId - ID of the user to follow
 * @param {string} username - Optional display name
 * @param {string} avatar - Optional avatar emoji
 * @returns {Object} Result object with success status
 */
export function followUser(userId, username = '', avatar = '') {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  // Cannot follow yourself
  if (currentUserId && userId === currentUserId) {
    showToast(t('cannotFollowSelf') || 'Tu ne peux pas te suivre toi-meme', 'warning');
    return { success: false, error: 'cannot_follow_self' };
  }

  // Check if user's profile is public
  if (!isProfilePublic(userId)) {
    showToast(t('profileIsPrivate') || 'Ce profil est prive. Tu ne peux pas suivre cet utilisateur.', 'warning');
    return { success: false, error: 'profile_is_private' };
  }

  // Check if already following
  const following = getFollowingFromStorage();
  if (following.some(f => f.id === userId)) {
    showToast(t('alreadyFollowing') || 'Tu suis deja cette personne', 'warning');
    return { success: false, error: 'already_following' };
  }

  // Create follow relationship
  const followData = {
    id: userId,
    username: username || userId,
    avatar: avatar || '',
    status: FollowStatus.ACTIVE,
    followedAt: new Date().toISOString(),
  };

  // Add to following list
  following.push(followData);
  saveFollowingToStorage(following);

  // Simulate adding to the target user's followers (in demo mode)
  // In production, this would be handled by the backend
  simulateAddFollower(userId, currentUserId || 'anonymous', state.username, state.avatar);

  showToast(`${t('nowFollowing') || 'Tu suis maintenant'} ${username || userId}`, 'success');

  return { success: true, follow: followData };
}

/**
 * Simulate adding a follower to a user (demo mode)
 * In production, the backend would handle this
 * @param {string} targetUserId - User being followed
 * @param {string} followerId - User who is following
 * @param {string} followerUsername - Follower's username
 * @param {string} followerAvatar - Follower's avatar
 */
function simulateAddFollower(targetUserId, followerId, followerUsername, followerAvatar) {
  // For the current user being followed (in demo, we simulate receiving followers)
  const state = getState();
  const currentUserId = state.user?.uid;

  // If someone is following us, add them to our followers
  if (targetUserId === currentUserId) {
    addFollowerToSelf({
      id: followerId,
      username: followerUsername || followerId,
      avatar: followerAvatar || '',
      followedAt: new Date().toISOString(),
    });
  }
}

/**
 * Add a follower to the current user (called when someone follows us)
 * @param {Object} follower - Follower data
 * @returns {Object} Result object
 */
export function addFollowerToSelf(follower) {
  if (!follower || !follower.id) {
    return { success: false, error: 'invalid_follower' };
  }

  const followers = getFollowersFromStorage();

  // Check if already a follower
  if (followers.some(f => f.id === follower.id)) {
    return { success: false, error: 'already_follower' };
  }

  const followerData = {
    id: follower.id,
    username: follower.username || follower.id,
    avatar: follower.avatar || '',
    status: FollowStatus.ACTIVE,
    followedAt: follower.followedAt || new Date().toISOString(),
  };

  followers.push(followerData);
  saveFollowersToStorage(followers);

  // Notify the user
  notifyNewFollower(followerData);

  return { success: true, follower: followerData };
}

/**
 * Unfollow a user
 * @param {string} userId - ID of the user to unfollow
 * @returns {Object} Result object with success status
 */
export function unfollowUser(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const following = getFollowingFromStorage();
  const followIndex = following.findIndex(f => f.id === userId);

  if (followIndex === -1) {
    showToast(t('notFollowing') || 'Tu ne suis pas cette personne', 'warning');
    return { success: false, error: 'not_following' };
  }

  // Remove from following list
  const removedFollow = following[followIndex];
  following.splice(followIndex, 1);
  saveFollowingToStorage(following);

  // In demo mode, also remove from target's followers
  // In production, backend would handle this
  const state = getState();
  const currentUserId = state.user?.uid;
  simulateRemoveFollower(userId, currentUserId || 'anonymous');

  showToast(`${t('unfollowed') || 'Tu ne suis plus'} ${removedFollow.username || userId}`, 'info');

  return { success: true, unfollowed: removedFollow };
}

/**
 * Simulate removing a follower from a user (demo mode)
 * @param {string} targetUserId - User being unfollowed
 * @param {string} followerId - User who is unfollowing
 */
function simulateRemoveFollower(targetUserId, followerId) {
  // In production, the backend would handle this
  // For demo, we just log it
  console.log(`[UserFollow] ${followerId} unfollowed ${targetUserId}`);
}

/**
 * Remove a follower from your followers list
 * @param {string} userId - ID of the follower to remove
 * @returns {Object} Result object with success status
 */
export function removeFollower(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const followers = getFollowersFromStorage();
  const followerIndex = followers.findIndex(f => f.id === userId);

  if (followerIndex === -1) {
    showToast(t('notAFollower') || 'Cette personne ne te suit pas', 'warning');
    return { success: false, error: 'not_a_follower' };
  }

  // Remove from followers list
  const removedFollower = followers[followerIndex];
  followers.splice(followerIndex, 1);
  saveFollowersToStorage(followers);

  showToast(`${removedFollower.username || userId} ${t('removedFromFollowers') || 'a ete retire de tes followers'}`, 'info');

  return { success: true, removed: removedFollower };
}

/**
 * Get list of followers for a user
 * @param {string} userId - Optional user ID (defaults to current user)
 * @returns {Array} Array of follower objects
 */
export function getFollowers(userId = null) {
  const state = getState();
  const currentUserId = state.user?.uid;

  // If requesting own followers or no userId provided
  if (!userId || userId === currentUserId) {
    return getFollowersFromStorage();
  }

  // For other users, check if their profile is public
  if (!isProfilePublic(userId)) {
    return []; // Cannot view followers of private profiles
  }

  // In demo mode, return mock followers for demo users
  return getMockFollowersForUser(userId);
}

/**
 * Get mock followers for demo users
 * @param {string} userId - User ID
 * @returns {Array} Mock followers
 */
function getMockFollowersForUser(userId) {
  const mockFollowers = {
    'marie_paris': [
      { id: 'user1', username: 'TravelMike', avatar: '', followedAt: '2025-06-15T10:00:00Z' },
      { id: 'user2', username: 'HitcherSophie', avatar: '', followedAt: '2025-07-20T14:30:00Z' },
    ],
    'thomas_berlin': [
      { id: 'user3', username: 'WandererJohn', avatar: '', followedAt: '2025-05-10T09:00:00Z' },
    ],
    'elena_barcelona': [
      { id: 'user4', username: 'RoadRunner', avatar: '', followedAt: '2025-08-01T16:00:00Z' },
      { id: 'user5', username: 'NomadNina', avatar: '', followedAt: '2025-08-05T11:00:00Z' },
      { id: 'user6', username: 'HighwayHero', avatar: '', followedAt: '2025-09-12T08:00:00Z' },
    ],
  };

  return mockFollowers[userId] || [];
}

/**
 * Get list of users that a user is following
 * @param {string} userId - Optional user ID (defaults to current user)
 * @returns {Array} Array of following objects
 */
export function getFollowing(userId = null) {
  const state = getState();
  const currentUserId = state.user?.uid;

  // If requesting own following or no userId provided
  if (!userId || userId === currentUserId) {
    return getFollowingFromStorage();
  }

  // For other users, check if their profile is public
  if (!isProfilePublic(userId)) {
    return []; // Cannot view following of private profiles
  }

  // In demo mode, return mock following for demo users
  return getMockFollowingForUser(userId);
}

/**
 * Get mock following for demo users
 * @param {string} userId - User ID
 * @returns {Array} Mock following
 */
function getMockFollowingForUser(userId) {
  const mockFollowing = {
    'marie_paris': [
      { id: 'thomas_berlin', username: 'Thomas Berlin', avatar: '', followedAt: '2025-05-01T10:00:00Z' },
    ],
    'thomas_berlin': [
      { id: 'marie_paris', username: 'Marie Paris', avatar: '', followedAt: '2025-06-01T14:00:00Z' },
      { id: 'elena_barcelona', username: 'Elena Barcelona', avatar: '', followedAt: '2025-07-15T09:00:00Z' },
    ],
    'elena_barcelona': [
      { id: 'marie_paris', username: 'Marie Paris', avatar: '', followedAt: '2025-08-20T16:00:00Z' },
    ],
  };

  return mockFollowing[userId] || [];
}

/**
 * Check if current user is following a user
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if following
 */
export function isFollowing(userId) {
  if (!userId) return false;
  const following = getFollowingFromStorage();
  return following.some(f => f.id === userId);
}

/**
 * Check if a user is following the current user
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if they are a follower
 */
export function isFollower(userId) {
  if (!userId) return false;
  const followers = getFollowersFromStorage();
  return followers.some(f => f.id === userId);
}

/**
 * Get follow counts for a user
 * @param {string} userId - Optional user ID (defaults to current user)
 * @returns {Object} Object with followerCount and followingCount
 */
export function getFollowCounts(userId = null) {
  const followers = getFollowers(userId);
  const following = getFollowing(userId);

  return {
    followerCount: followers.length,
    followingCount: following.length,
  };
}

/**
 * Toggle follow status for a user
 * @param {string} userId - ID of the user
 * @param {string} username - Optional display name
 * @param {string} avatar - Optional avatar
 * @returns {Object} Result object with new following status
 */
export function toggleFollow(userId, username = '', avatar = '') {
  if (isFollowing(userId)) {
    const result = unfollowUser(userId);
    return { ...result, isFollowing: false };
  } else {
    const result = followUser(userId, username, avatar);
    return { ...result, isFollowing: result.success };
  }
}

/**
 * Get follow statistics for current user
 * @returns {Object} Statistics object
 */
export function getFollowStats() {
  const followers = getFollowersFromStorage();
  const following = getFollowingFromStorage();

  // Calculate mutual follows
  const mutualFollows = followers.filter(follower =>
    following.some(f => f.id === follower.id)
  );

  // Find most recent follower
  const mostRecentFollower = followers.length > 0
    ? followers.reduce((latest, f) =>
        new Date(f.followedAt) > new Date(latest.followedAt) ? f : latest
      )
    : null;

  // Find oldest follow (who you've followed the longest)
  const oldestFollow = following.length > 0
    ? following.reduce((oldest, f) =>
        new Date(f.followedAt) < new Date(oldest.followedAt) ? f : oldest
      )
    : null;

  return {
    followerCount: followers.length,
    followingCount: following.length,
    mutualFollowCount: mutualFollows.length,
    mutualFollows,
    mostRecentFollower,
    oldestFollow,
    profileVisibility: getProfileVisibility(),
  };
}

/**
 * Search in following list
 * @param {string} query - Search query
 * @returns {Array} Matching users
 */
export function searchFollowing(query) {
  if (!query) return getFollowingFromStorage();

  const following = getFollowingFromStorage();
  const lowerQuery = query.toLowerCase();

  return following.filter(f =>
    f.username?.toLowerCase().includes(lowerQuery) ||
    f.id?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search in followers list
 * @param {string} query - Search query
 * @returns {Array} Matching users
 */
export function searchFollowers(query) {
  if (!query) return getFollowersFromStorage();

  const followers = getFollowersFromStorage();
  const lowerQuery = query.toLowerCase();

  return followers.filter(f =>
    f.username?.toLowerCase().includes(lowerQuery) ||
    f.id?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Clear all follow data (for testing or account reset)
 * @returns {Object} Result object
 */
export function clearAllFollowData() {
  saveFollowersToStorage([]);
  saveFollowingToStorage([]);

  showToast(t('followDataCleared') || 'Donnees de suivi effacees', 'info');

  return { success: true };
}

/**
 * Add a mock follower (for testing/demo)
 * @param {Object} followerData - Follower data
 * @returns {Object} Result object
 */
export function addMockFollower(followerData) {
  if (!followerData?.id) {
    return { success: false, error: 'invalid_follower_data' };
  }

  return addFollowerToSelf(followerData);
}

/**
 * Render follow button HTML
 * @param {string} userId - ID of the user
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderFollowButton(userId, options = {}) {
  if (!userId) return '';

  const state = getState();
  const currentUserId = state.user?.uid;

  // Don't show follow button for own profile
  if (currentUserId && userId === currentUserId) {
    return '';
  }

  const {
    username = '',
    avatar = '',
    size = 'md',
    showCount = false,
  } = options;

  const following = isFollowing(userId);
  const profilePublic = isProfilePublic(userId);

  // Sizes
  const sizeClasses = {
    sm: 'btn-sm text-xs px-2 py-1',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // If profile is private
  if (!profilePublic) {
    return `
      <button
        class="btn ${sizeClass} bg-slate-600/50 text-slate-400 cursor-not-allowed"
        disabled
        aria-label="${t('privateProfile') || 'Profil prive'}"
        title="${t('cannotFollowPrivate') || 'Ce profil est prive'}"
      >
        <i class="fas fa-lock mr-1"></i>
        ${t('private') || 'Prive'}
      </button>
    `;
  }

  // Following state
  if (following) {
    return `
      <button
        onclick="toggleFollowHandler('${escapeHTML(userId)}', '${escapeHTML(username)}', '${escapeHTML(avatar)}')"
        class="btn ${sizeClass} bg-primary-500/20 text-primary-400 hover:bg-danger-500/20 hover:text-danger-400 transition-all group"
        aria-label="${t('unfollow') || 'Ne plus suivre'} ${escapeHTML(username || userId)}"
        data-user-id="${escapeHTML(userId)}"
        data-following="true"
      >
        <span class="group-hover:hidden flex items-center gap-1">
          <i class="fas fa-check"></i>
          ${t('following') || 'Suivi'}
          ${showCount ? `<span class="ml-1 text-xs opacity-70">(${getFollowCounts(userId).followerCount})</span>` : ''}
        </span>
        <span class="hidden group-hover:flex items-center gap-1">
          <i class="fas fa-user-minus"></i>
          ${t('unfollow') || 'Ne plus suivre'}
        </span>
      </button>
    `;
  }

  // Not following
  return `
    <button
      onclick="toggleFollowHandler('${escapeHTML(userId)}', '${escapeHTML(username)}', '${escapeHTML(avatar)}')"
      class="btn ${sizeClass} btn-primary"
      aria-label="${t('follow') || 'Suivre'} ${escapeHTML(username || userId)}"
      data-user-id="${escapeHTML(userId)}"
      data-following="false"
    >
      <i class="fas fa-user-plus mr-1"></i>
      ${t('follow') || 'Suivre'}
      ${showCount ? `<span class="ml-1 text-xs opacity-70">(${getFollowCounts(userId).followerCount})</span>` : ''}
    </button>
  `;
}

/**
 * Render follower card HTML
 * @param {Object} follower - Follower object
 * @returns {string} HTML string
 */
export function renderFollowerCard(follower) {
  if (!follower || !follower.id) return '';

  const avatar = follower.avatar || '';
  const username = escapeHTML(follower.username || follower.id);
  const followedAt = formatRelativeTime(follower.followedAt);
  const isMutual = isFollowing(follower.id);

  return `
    <div
      class="follower-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-follower-id="${escapeHTML(follower.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-2xl">
          ${avatar ? escapeHTML(avatar) : '<i class="fas fa-user text-white text-lg"></i>'}
        </div>
        <div>
          <div class="font-medium text-white flex items-center gap-2">
            ${username}
            ${isMutual ? '<span class="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">' + (t('mutual') || 'Mutuel') + '</span>' : ''}
          </div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            <i class="fas fa-user-plus"></i>
            <span>${t('followsSince') || 'Te suit depuis'} ${escapeHTML(followedAt)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${renderFollowButton(follower.id, { username: follower.username, avatar: follower.avatar, size: 'sm' })}
        <button
          onclick="removeFollowerHandler('${escapeHTML(follower.id)}')"
          class="btn btn-sm bg-white/10 hover:bg-danger-500/20 text-white hover:text-danger-400"
          aria-label="${t('removeFollower') || 'Retirer'}"
          title="${t('removeFollower') || 'Retirer ce follower'}"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render following card HTML
 * @param {Object} user - Following user object
 * @returns {string} HTML string
 */
export function renderFollowingCard(user) {
  if (!user || !user.id) return '';

  const avatar = user.avatar || '';
  const username = escapeHTML(user.username || user.id);
  const followedAt = formatRelativeTime(user.followedAt);
  const isFollowingBack = isFollower(user.id);

  return `
    <div
      class="following-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-following-id="${escapeHTML(user.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-primary-500 flex items-center justify-center text-2xl">
          ${avatar ? escapeHTML(avatar) : '<i class="fas fa-user text-white text-lg"></i>'}
        </div>
        <div>
          <div class="font-medium text-white flex items-center gap-2">
            ${username}
            ${isFollowingBack ? '<span class="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">' + (t('followsYou') || 'Te suit') + '</span>' : ''}
          </div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            <i class="fas fa-heart"></i>
            <span>${t('followedSince') || 'Suivi depuis'} ${escapeHTML(followedAt)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick="openUserProfile('${escapeHTML(user.id)}')"
          class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
          aria-label="${t('viewProfile') || 'Voir le profil'}"
        >
          <i class="fas fa-user"></i>
        </button>
        <button
          onclick="unfollowUserHandler('${escapeHTML(user.id)}')"
          class="btn btn-sm bg-danger-500/20 hover:bg-danger-500/30 text-danger-400"
          aria-label="${t('unfollow') || 'Ne plus suivre'}"
        >
          <i class="fas fa-user-minus"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render followers list HTML
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderFollowersList(options = {}) {
  const { searchQuery = '', userId = null } = options;

  const followers = searchQuery
    ? searchFollowers(searchQuery)
    : getFollowers(userId);

  if (followers.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">👥</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noFollowers') || 'Pas encore de followers')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noFollowersDesc') || 'Partage ton profil pour avoir des followers !')}</p>
      </div>
    `;
  }

  return `
    <div class="followers-list space-y-2" role="list" aria-label="${t('followers') || 'Followers'}">
      ${followers.map(f => renderFollowerCard(f)).join('')}
    </div>
  `;
}

/**
 * Render following list HTML
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderFollowingList(options = {}) {
  const { searchQuery = '', userId = null } = options;

  const following = searchQuery
    ? searchFollowing(searchQuery)
    : getFollowing(userId);

  if (following.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('notFollowingAnyone') || 'Tu ne suis personne')}</h3>
        <p class="text-slate-400 text-sm mb-4">${escapeHTML(t('notFollowingDesc') || 'Decouvre des autostoppeurs a suivre !')}</p>
        <button onclick="openDiscoverUsers()" class="btn btn-primary">
          <i class="fas fa-search mr-2"></i>
          ${t('discoverUsers') || 'Decouvrir'}
        </button>
      </div>
    `;
  }

  return `
    <div class="following-list space-y-2" role="list" aria-label="${t('following') || 'Abonnements'}">
      ${following.map(f => renderFollowingCard(f)).join('')}
    </div>
  `;
}

/**
 * Render profile visibility toggle HTML
 * @returns {string} HTML string
 */
export function renderVisibilityToggle() {
  const visibility = getProfileVisibility();
  const isPublic = visibility === ProfileVisibility.PUBLIC;

  return `
    <div class="visibility-toggle p-4 bg-white/5 rounded-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${isPublic ? 'bg-primary-500/20' : 'bg-slate-600/50'} flex items-center justify-center">
            <i class="fas ${isPublic ? 'fa-globe text-primary-400' : 'fa-lock text-slate-400'}"></i>
          </div>
          <div>
            <div class="font-medium text-white">${t('profileVisibility') || 'Visibilite du profil'}</div>
            <div class="text-xs text-slate-400">
              ${isPublic
                ? t('profilePublicDesc') || 'Tout le monde peut te suivre'
                : t('profilePrivateDesc') || 'Personne ne peut te suivre'}
            </div>
          </div>
        </div>
        <button
          onclick="toggleProfileVisibility()"
          class="relative w-14 h-7 rounded-full transition-colors ${isPublic ? 'bg-primary-500' : 'bg-slate-600'}"
          role="switch"
          aria-checked="${isPublic}"
          aria-label="${t('toggleVisibility') || 'Changer la visibilite'}"
        >
          <span
            class="absolute top-1 ${isPublic ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full transition-all shadow-md"
          ></span>
        </button>
      </div>
    </div>
  `;
}

// Global handlers for onclick events
window.toggleFollowHandler = (userId, username, avatar) => {
  toggleFollow(userId, username, avatar);
};

window.unfollowUserHandler = (userId) => {
  unfollowUser(userId);
};

window.removeFollowerHandler = (userId) => {
  const confirmed = window.confirm(
    t('confirmRemoveFollower') || 'Retirer ce follower ?'
  );
  if (confirmed) {
    removeFollower(userId);
  }
};

window.toggleProfileVisibility = () => {
  const current = getProfileVisibility();
  const newVisibility = current === ProfileVisibility.PUBLIC
    ? ProfileVisibility.PRIVATE
    : ProfileVisibility.PUBLIC;
  setProfileVisibility(newVisibility);
};

window.openUserProfile = (userId) => {
  setState({
    selectedProfile: userId,
    showProfileModal: true,
  });
};

window.openDiscoverUsers = () => {
  setState({
    showDiscoverUsers: true,
  });
};

// Export default with all functions
export default {
  ProfileVisibility,
  FollowStatus,
  getProfileVisibility,
  setProfileVisibility,
  isProfilePublic,
  followUser,
  unfollowUser,
  removeFollower,
  addFollowerToSelf,
  getFollowers,
  getFollowing,
  isFollowing,
  isFollower,
  getFollowCounts,
  toggleFollow,
  getFollowStats,
  searchFollowing,
  searchFollowers,
  clearAllFollowData,
  addMockFollower,
  renderFollowButton,
  renderFollowerCard,
  renderFollowingCard,
  renderFollowersList,
  renderFollowingList,
  renderVisibilityToggle,
};
