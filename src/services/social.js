/**
 * Social Service
 * Handles all social features: friends, blocks, follows, reports
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { getCurrentUser } from './firebase.js';

// Storage keys
const SOCIAL_STORAGE_KEY = 'spothitch_social';
const BLOCKED_USERS_KEY = 'spothitch_blocked_users';
const REPORTED_USERS_KEY = 'spothitch_reported_users';

/**
 * Get social data from storage
 */
function getSocialData() {
  try {
    const data = Storage.get(SOCIAL_STORAGE_KEY);
    return data || {
      friends: [],
      friendRequests: [],
      sentRequests: [],
      following: [],
      followers: [],
      blockedUsers: [],
      mutedConversations: [],
    };
  } catch {
    return {
      friends: [],
      friendRequests: [],
      sentRequests: [],
      following: [],
      followers: [],
      blockedUsers: [],
      mutedConversations: [],
    };
  }
}

/**
 * Save social data to storage
 */
function saveSocialData(data) {
  Storage.set(SOCIAL_STORAGE_KEY, data);
  // Update state
  setState({
    friends: data.friends,
    friendRequests: data.friendRequests,
    following: data.following,
    followers: data.followers,
    blockedUsers: data.blockedUsers,
  });
}

// ==================== FRIENDS ====================

/**
 * Send friend request
 * @param {string} userId - Target user ID
 * @param {Object} userData - User data (name, avatar, etc.)
 */
export function sendFriendRequest(userId, userData) {
  const data = getSocialData();
  const currentUser = getCurrentUser();

  // Check if already friends
  if (data.friends.some(f => f.id === userId)) {
    return { success: false, error: 'already_friends' };
  }

  // Check if request already sent
  if (data.sentRequests.some(r => r.id === userId)) {
    return { success: false, error: 'request_pending' };
  }

  // Check if blocked
  if (data.blockedUsers.some(b => b.id === userId)) {
    return { success: false, error: 'user_blocked' };
  }

  data.sentRequests.push({
    id: userId,
    name: userData.name,
    avatar: userData.avatar,
    level: userData.level || 1,
    sentAt: new Date().toISOString(),
  });

  saveSocialData(data);
  return { success: true };
}

/**
 * Accept friend request
 * @param {string} requestId - Request/User ID
 */
export function acceptFriendRequest(requestId) {
  const data = getSocialData();

  const request = data.friendRequests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, error: 'request_not_found' };
  }

  // Remove from requests
  data.friendRequests = data.friendRequests.filter(r => r.id !== requestId);

  // Add to friends
  data.friends.push({
    ...request,
    friendsSince: new Date().toISOString(),
    online: false,
    lastSeen: null,
    unread: 0,
  });

  saveSocialData(data);
  return { success: true, friend: data.friends.find(f => f.id === requestId) };
}

/**
 * Decline friend request
 * @param {string} requestId - Request/User ID
 */
export function declineFriendRequest(requestId) {
  const data = getSocialData();
  data.friendRequests = data.friendRequests.filter(r => r.id !== requestId);
  saveSocialData(data);
  return { success: true };
}

/**
 * Remove friend
 * @param {string} friendId - Friend user ID
 */
export function removeFriend(friendId) {
  const data = getSocialData();
  data.friends = data.friends.filter(f => f.id !== friendId);
  saveSocialData(data);
  return { success: true };
}

/**
 * Get friends list
 */
export function getFriends() {
  const data = getSocialData();
  return data.friends;
}

/**
 * Get friend requests
 */
export function getFriendRequests() {
  const data = getSocialData();
  return data.friendRequests;
}

/**
 * Get suggested friends based on common trips/checkins
 */
export function getSuggestedFriends() {
  const state = getState();
  const data = getSocialData();

  // Mock suggested friends - in real app, this would come from backend
  const mockSuggestions = [
    { id: 'sug1', name: 'Marie', avatar: '👩', level: 8, commonTrips: 3, mutualFriends: 2 },
    { id: 'sug2', name: 'Thomas', avatar: '🧔', level: 12, commonTrips: 5, mutualFriends: 1 },
    { id: 'sug3', name: 'Lisa', avatar: '👱‍♀️', level: 5, commonTrips: 2, mutualFriends: 4 },
    { id: 'sug4', name: 'Alex', avatar: '🧑', level: 15, commonTrips: 1, mutualFriends: 3 },
  ];

  // Filter out existing friends and blocked users
  return mockSuggestions.filter(s =>
    !data.friends.some(f => f.id === s.id) &&
    !data.blockedUsers.some(b => b.id === s.id)
  );
}

// ==================== FOLLOW SYSTEM ====================

/**
 * Follow a user (only if their profile is public)
 * @param {string} userId - User to follow
 * @param {Object} userData - User data
 */
export function followUser(userId, userData) {
  const data = getSocialData();

  if (!userData.isPublic) {
    return { success: false, error: 'profile_private' };
  }

  if (data.following.some(f => f.id === userId)) {
    return { success: false, error: 'already_following' };
  }

  if (data.blockedUsers.some(b => b.id === userId)) {
    return { success: false, error: 'user_blocked' };
  }

  data.following.push({
    id: userId,
    name: userData.name,
    avatar: userData.avatar,
    level: userData.level || 1,
    followedAt: new Date().toISOString(),
  });

  saveSocialData(data);
  return { success: true };
}

/**
 * Unfollow a user
 * @param {string} userId - User to unfollow
 */
export function unfollowUser(userId) {
  const data = getSocialData();
  data.following = data.following.filter(f => f.id !== userId);
  saveSocialData(data);
  return { success: true };
}

/**
 * Get following list
 */
export function getFollowing() {
  const data = getSocialData();
  return data.following;
}

/**
 * Get followers list
 */
export function getFollowers() {
  const data = getSocialData();
  return data.followers;
}

/**
 * Check if following a user
 * @param {string} userId - User ID to check
 */
export function isFollowing(userId) {
  const data = getSocialData();
  return data.following.some(f => f.id === userId);
}

// ==================== BLOCK SYSTEM ====================

/**
 * Block a user
 * @param {string} userId - User to block
 * @param {Object} userData - User data
 */
export function blockUser(userId, userData) {
  const data = getSocialData();

  if (data.blockedUsers.some(b => b.id === userId)) {
    return { success: false, error: 'already_blocked' };
  }

  // Remove from friends if present
  data.friends = data.friends.filter(f => f.id !== userId);
  data.friendRequests = data.friendRequests.filter(r => r.id !== userId);
  data.sentRequests = data.sentRequests.filter(r => r.id !== userId);
  data.following = data.following.filter(f => f.id !== userId);
  data.followers = data.followers.filter(f => f.id !== userId);

  data.blockedUsers.push({
    id: userId,
    name: userData?.name || 'Utilisateur',
    avatar: userData?.avatar || '🚫',
    blockedAt: new Date().toISOString(),
  });

  saveSocialData(data);
  return { success: true };
}

/**
 * Unblock a user
 * @param {string} userId - User to unblock
 */
export function unblockUser(userId) {
  const data = getSocialData();
  data.blockedUsers = data.blockedUsers.filter(b => b.id !== userId);
  saveSocialData(data);
  return { success: true };
}

/**
 * Get blocked users list
 */
export function getBlockedUsers() {
  const data = getSocialData();
  return data.blockedUsers;
}

/**
 * Check if user is blocked
 * @param {string} userId - User ID to check
 */
export function isBlocked(userId) {
  const data = getSocialData();
  return data.blockedUsers.some(b => b.id === userId);
}

// ==================== REPORT SYSTEM ====================

/**
 * Report a user
 * @param {string} userId - User to report
 * @param {string} reason - Report reason
 * @param {string} details - Additional details
 */
export function reportUser(userId, reason, details = '') {
  try {
    const reports = Storage.get(REPORTED_USERS_KEY) || [];
    const currentUser = getCurrentUser();

    reports.push({
      id: `report_${Date.now()}`,
      reportedUserId: userId,
      reporterId: currentUser?.uid || 'anonymous',
      reason,
      details,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    Storage.set(REPORTED_USERS_KEY, reports);
    return { success: true };
  } catch (error) {
    console.error('Error reporting user:', error);
    return { success: false, error };
  }
}

/**
 * Get report reasons
 */
export function getReportReasons() {
  return [
    { id: 'harassment', label: 'Harcelement', icon: '🚫' },
    { id: 'spam', label: 'Spam', icon: '📧' },
    { id: 'inappropriate', label: 'Contenu inapproprie', icon: '⚠️' },
    { id: 'fake_profile', label: 'Faux profil', icon: '🎭' },
    { id: 'scam', label: 'Arnaque', icon: '💰' },
    { id: 'dangerous', label: 'Comportement dangereux', icon: '☠️' },
    { id: 'other', label: 'Autre', icon: '❓' },
  ];
}

// ==================== MUTE SYSTEM ====================

/**
 * Mute a conversation
 * @param {string} conversationId - Conversation ID (friend ID or group ID)
 * @param {number} duration - Duration in hours (0 = permanent)
 */
export function muteConversation(conversationId, duration = 0) {
  const data = getSocialData();

  const existingMute = data.mutedConversations.find(m => m.id === conversationId);
  if (existingMute) {
    existingMute.mutedUntil = duration === 0 ? null : new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
  } else {
    data.mutedConversations.push({
      id: conversationId,
      mutedAt: new Date().toISOString(),
      mutedUntil: duration === 0 ? null : new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
    });
  }

  saveSocialData(data);
  return { success: true };
}

/**
 * Unmute a conversation
 * @param {string} conversationId - Conversation ID
 */
export function unmuteConversation(conversationId) {
  const data = getSocialData();
  data.mutedConversations = data.mutedConversations.filter(m => m.id !== conversationId);
  saveSocialData(data);
  return { success: true };
}

/**
 * Check if conversation is muted
 * @param {string} conversationId - Conversation ID
 */
export function isConversationMuted(conversationId) {
  const data = getSocialData();
  const mute = data.mutedConversations.find(m => m.id === conversationId);

  if (!mute) return false;
  if (!mute.mutedUntil) return true; // Permanent mute

  // Check if mute has expired
  if (new Date(mute.mutedUntil) < new Date()) {
    unmuteConversation(conversationId);
    return false;
  }

  return true;
}

/**
 * Get mute options
 */
export function getMuteOptions() {
  return [
    { duration: 1, label: '1 heure' },
    { duration: 8, label: '8 heures' },
    { duration: 24, label: '24 heures' },
    { duration: 168, label: '1 semaine' },
    { duration: 0, label: 'Permanent' },
  ];
}

// ==================== USER SEARCH ====================

/**
 * Search users by username
 * @param {string} query - Search query
 */
export function searchUsers(query) {
  if (!query || query.length < 2) return [];

  const data = getSocialData();
  const queryLower = query.toLowerCase();

  // Mock search - in real app, this would be an API call
  const mockUsers = [
    { id: 'user1', name: 'JeanPierre', avatar: '🧔', level: 15, isPublic: true },
    { id: 'user2', name: 'Marie123', avatar: '👩', level: 8, isPublic: true },
    { id: 'user3', name: 'TomHiker', avatar: '🥾', level: 22, isPublic: false },
    { id: 'user4', name: 'Lisa_Voyage', avatar: '🌍', level: 10, isPublic: true },
    { id: 'user5', name: 'MaxRoute', avatar: '🚗', level: 5, isPublic: true },
  ];

  return mockUsers
    .filter(u => u.name.toLowerCase().includes(queryLower))
    .filter(u => !data.blockedUsers.some(b => b.id === u.id));
}

// ==================== ONLINE STATUS ====================

/**
 * Update user online status
 * This would typically be handled by Firebase presence
 */
export function updateOnlineStatus(isOnline) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // In real app, update Firebase presence
  setState({ userOnline: isOnline });
}

/**
 * Get friend's online status
 * @param {string} friendId - Friend ID
 */
export function getFriendOnlineStatus(friendId) {
  const data = getSocialData();
  const friend = data.friends.find(f => f.id === friendId);
  return friend?.online || false;
}

// ==================== COMPANION SEARCH ====================

/**
 * Search for travel companions going in the same direction
 * @param {Object} destination - { lat, lng, city }
 * @param {string} date - Travel date
 */
export function searchCompanions(destination, date) {
  // Mock companions - in real app, this would query Firebase
  const mockCompanions = [
    {
      id: 'comp1',
      name: 'Sophie',
      avatar: '👩‍🦰',
      level: 12,
      destination: 'Berlin',
      departureDate: date,
      departureCity: 'Paris',
      experience: 'intermediate',
      languages: ['fr', 'en', 'de'],
      rating: 4.8,
    },
    {
      id: 'comp2',
      name: 'Lucas',
      avatar: '🧑‍🦱',
      level: 8,
      destination: 'Amsterdam',
      departureDate: date,
      departureCity: 'Lyon',
      experience: 'beginner',
      languages: ['fr', 'en'],
      rating: 4.5,
    },
    {
      id: 'comp3',
      name: 'Emma',
      avatar: '👱‍♀️',
      level: 20,
      destination: 'Barcelona',
      departureDate: date,
      departureCity: 'Marseille',
      experience: 'expert',
      languages: ['fr', 'es', 'en', 'it'],
      rating: 4.9,
    },
  ];

  return mockCompanions;
}

// ==================== INVITATIONS & REFERRAL ====================

/**
 * Generate invitation link
 */
export function generateInviteLink() {
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid || 'guest';
  return `https://spothitch.app/join?ref=${userId}`;
}

/**
 * Get referral stats
 */
export function getReferralStats() {
  // Mock stats - in real app, this would come from backend
  return {
    totalInvited: 5,
    totalJoined: 3,
    pointsEarned: 150,
    pendingBonus: 50,
  };
}

/**
 * Track referral signup
 * @param {string} referrerId - ID of the user who referred
 */
export function trackReferral(referrerId) {
  /* no-op */
}

// ==================== SOCIAL SHARING ====================

/**
 * Share to social media
 * @param {string} platform - 'facebook' | 'twitter' | 'whatsapp' | 'telegram'
 * @param {Object} content - { title, text, url }
 */
export function shareToSocial(platform, content) {
  const { title, text, url } = content;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const urls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
  };

  const shareUrl = urls[platform];
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    return { success: true };
  }

  return { success: false, error: 'unknown_platform' };
}

/**
 * Native share (Web Share API)
 * @param {Object} content - { title, text, url }
 */
export async function nativeShare(content) {
  if (!navigator.share) {
    return { success: false, error: 'not_supported' };
  }

  try {
    await navigator.share(content);
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: error.message };
  }
}

// Export all functions
export default {
  // Friends
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getSuggestedFriends,
  // Follow
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  isFollowing,
  // Block
  blockUser,
  unblockUser,
  getBlockedUsers,
  isBlocked,
  // Report
  reportUser,
  getReportReasons,
  // Mute
  muteConversation,
  unmuteConversation,
  isConversationMuted,
  getMuteOptions,
  // Search
  searchUsers,
  searchCompanions,
  // Online status
  updateOnlineStatus,
  getFriendOnlineStatus,
  // Invitations
  generateInviteLink,
  getReferralStats,
  trackReferral,
  // Sharing
  shareToSocial,
  nativeShare,
};
