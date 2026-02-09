/**
 * Friend Suggestions Service
 * Feature #196 - Service pour les suggestions d'amis
 *
 * Suggere des amis potentiels bases sur des criteres comme:
 * - Spots visites en commun
 * - Pays visites en commun
 * - Proximite geographique
 * - Amis en commun
 * - Niveau et activite similaire
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { getFriends, isFriend } from './friendsList.js';

// Storage keys
const SUGGESTIONS_KEY = 'spothitch_friend_suggestions';
const DISMISSED_KEY = 'spothitch_dismissed_suggestions';
const SUGGESTIONS_CACHE_KEY = 'spothitch_suggestions_cache_time';

// Cache duration: 1 hour (in ms)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Suggestion reasons enum
 */
export const SuggestionReason = {
  COMMON_SPOTS: 'common_spots',
  COMMON_COUNTRIES: 'common_countries',
  NEARBY: 'nearby',
  MUTUAL_FRIENDS: 'mutual_friends',
  SIMILAR_LEVEL: 'similar_level',
  ACTIVE_USER: 'active_user',
  NEW_USER: 'new_user',
};

/**
 * Get stored suggestions from storage
 * @returns {Array} Array of suggestion objects
 */
function getSuggestionsFromStorage() {
  try {
    const data = Storage.get(SUGGESTIONS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[FriendSuggestions] Error reading suggestions:', error);
    return [];
  }
}

/**
 * Save suggestions to storage
 * @param {Array} suggestions - Array of suggestion objects
 */
function saveSuggestionsToStorage(suggestions) {
  try {
    Storage.set(SUGGESTIONS_KEY, suggestions);
    Storage.set(SUGGESTIONS_CACHE_KEY, Date.now());
  } catch (error) {
    console.error('[FriendSuggestions] Error saving suggestions:', error);
  }
}

/**
 * Get dismissed suggestions from storage
 * @returns {Array} Array of dismissed user IDs
 */
function getDismissedFromStorage() {
  try {
    const data = Storage.get(DISMISSED_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[FriendSuggestions] Error reading dismissed:', error);
    return [];
  }
}

/**
 * Save dismissed to storage
 * @param {Array} dismissed - Array of dismissed user IDs
 */
function saveDismissedToStorage(dismissed) {
  try {
    Storage.set(DISMISSED_KEY, dismissed);
  } catch (error) {
    console.error('[FriendSuggestions] Error saving dismissed:', error);
  }
}

/**
 * Check if cache is still valid
 * @returns {boolean} True if cache is valid
 */
function isCacheValid() {
  try {
    const cacheTime = Storage.get(SUGGESTIONS_CACHE_KEY);
    if (!cacheTime) return false;
    return Date.now() - cacheTime < CACHE_DURATION;
  } catch {
    return false;
  }
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
 * Get reason label for display
 * @param {string} reason - Reason code
 * @returns {string} Localized reason label
 */
function getReasonLabel(reason) {
  const labels = {
    [SuggestionReason.COMMON_SPOTS]: t('suggestionCommonSpots') || 'Spots en commun',
    [SuggestionReason.COMMON_COUNTRIES]: t('suggestionCommonCountries') || 'Pays en commun',
    [SuggestionReason.NEARBY]: t('suggestionNearby') || 'Pres de toi',
    [SuggestionReason.MUTUAL_FRIENDS]: t('suggestionMutualFriends') || 'Amis en commun',
    [SuggestionReason.SIMILAR_LEVEL]: t('suggestionSimilarLevel') || 'Niveau similaire',
    [SuggestionReason.ACTIVE_USER]: t('suggestionActiveUser') || 'Utilisateur actif',
    [SuggestionReason.NEW_USER]: t('suggestionNewUser') || 'Nouveau routard',
  };
  return labels[reason] || reason;
}

/**
 * Get reason icon
 * @param {string} reason - Reason code
 * @returns {string} FontAwesome icon class
 */
function getReasonIcon(reason) {
  const icons = {
    [SuggestionReason.COMMON_SPOTS]: 'fa-map-marker-alt',
    [SuggestionReason.COMMON_COUNTRIES]: 'fa-globe-europe',
    [SuggestionReason.NEARBY]: 'fa-location-arrow',
    [SuggestionReason.MUTUAL_FRIENDS]: 'fa-user-friends',
    [SuggestionReason.SIMILAR_LEVEL]: 'fa-chart-line',
    [SuggestionReason.ACTIVE_USER]: 'fa-fire',
    [SuggestionReason.NEW_USER]: 'fa-star',
  };
  return icons[reason] || 'fa-question';
}

/**
 * Calculate score for a potential friend
 * @param {Object} user - User object
 * @param {Object} currentUser - Current user data
 * @returns {number} Score (higher is better)
 */
function calculateSuggestionScore(user, currentUser) {
  let score = 0;

  // Common spots (10 points per spot)
  const commonSpots = (user.visitedSpots || []).filter(
    s => (currentUser.visitedSpots || []).includes(s)
  ).length;
  score += commonSpots * 10;

  // Common countries (15 points per country)
  const commonCountries = (user.visitedCountries || []).filter(
    c => (currentUser.visitedCountries || []).includes(c)
  ).length;
  score += commonCountries * 15;

  // Mutual friends (20 points per friend)
  const friends = getFriends();
  const friendIds = friends.map(f => f.id);
  const mutualFriends = (user.friends || []).filter(f => friendIds.includes(f)).length;
  score += mutualFriends * 20;

  // Similar level (max 25 points)
  const levelDiff = Math.abs((user.level || 1) - (currentUser.level || 1));
  if (levelDiff <= 2) score += 25;
  else if (levelDiff <= 5) score += 15;
  else if (levelDiff <= 10) score += 5;

  // Activity bonus (if user has been active recently)
  if (user.lastActive) {
    const daysSinceActive = (Date.now() - new Date(user.lastActive)) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 1) score += 30;
    else if (daysSinceActive <= 7) score += 20;
    else if (daysSinceActive <= 30) score += 10;
  }

  // New user bonus (to help new users find friends)
  if (user.checkins <= 5) {
    score += 15;
  }

  return score;
}

/**
 * Determine primary reason for suggestion
 * @param {Object} user - User object
 * @param {Object} currentUser - Current user data
 * @returns {string} Primary reason code
 */
function determinePrimaryReason(user, currentUser) {
  const friends = getFriends();
  const friendIds = friends.map(f => f.id);
  const mutualFriends = (user.friends || []).filter(f => friendIds.includes(f)).length;

  if (mutualFriends >= 2) return SuggestionReason.MUTUAL_FRIENDS;

  const commonSpots = (user.visitedSpots || []).filter(
    s => (currentUser.visitedSpots || []).includes(s)
  ).length;
  if (commonSpots >= 3) return SuggestionReason.COMMON_SPOTS;

  const commonCountries = (user.visitedCountries || []).filter(
    c => (currentUser.visitedCountries || []).includes(c)
  ).length;
  if (commonCountries >= 2) return SuggestionReason.COMMON_COUNTRIES;

  // Check proximity (if both have locations)
  if (user.location && currentUser.location) {
    const distance = calculateDistance(
      user.location.lat, user.location.lng,
      currentUser.location.lat, currentUser.location.lng
    );
    if (distance <= 50) return SuggestionReason.NEARBY;
  }

  const levelDiff = Math.abs((user.level || 1) - (currentUser.level || 1));
  if (levelDiff <= 3) return SuggestionReason.SIMILAR_LEVEL;

  if (user.lastActive) {
    const daysSinceActive = (Date.now() - new Date(user.lastActive)) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 7) return SuggestionReason.ACTIVE_USER;
  }

  if (user.checkins <= 5) return SuggestionReason.NEW_USER;

  return SuggestionReason.ACTIVE_USER;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate suggestions from a list of users
 * @param {Array} users - Array of potential users
 * @param {number} limit - Maximum number of suggestions
 * @returns {Array} Array of suggestion objects
 */
export function generateSuggestions(users, limit = 10) {
  const state = getState();
  const currentUserId = state.user?.uid;
  const currentUser = {
    level: state.level || 1,
    visitedSpots: state.checkinHistory?.map(c => c.spotId) || [],
    visitedCountries: [...new Set(state.checkinHistory?.map(c => c.country) || [])],
    location: state.userLocation,
  };

  const friends = getFriends();
  const friendIds = friends.map(f => f.id);
  const dismissed = getDismissedFromStorage();

  // Filter out current user, friends, and dismissed users
  const candidates = users.filter(user => {
    if (!user.id) return false;
    if (user.id === currentUserId) return false;
    if (friendIds.includes(user.id)) return false;
    if (dismissed.includes(user.id)) return false;
    return true;
  });

  // Score and sort candidates
  const scored = candidates.map(user => ({
    ...user,
    score: calculateSuggestionScore(user, currentUser),
    reason: determinePrimaryReason(user, currentUser),
  })).sort((a, b) => b.score - a.score);

  // Return top suggestions
  return scored.slice(0, limit).map(user => ({
    id: user.id,
    username: user.username || user.id,
    avatar: user.avatar || '',
    level: user.level || 1,
    checkins: user.checkins || 0,
    score: user.score,
    reason: user.reason,
    mutualFriends: (user.friends || []).filter(f => friendIds.includes(f)).length,
    suggestedAt: new Date().toISOString(),
  }));
}

/**
 * Get cached suggestions or generate new ones
 * @param {Array} users - Array of all users (optional, for regeneration)
 * @returns {Array} Array of suggestions
 */
export function getSuggestions(users = null) {
  // Check cache first
  if (isCacheValid()) {
    const cached = getSuggestionsFromStorage();
    if (cached.length > 0) {
      // Filter out any that are now friends or dismissed
      const friends = getFriends();
      const friendIds = friends.map(f => f.id);
      const dismissed = getDismissedFromStorage();

      return cached.filter(s =>
        !friendIds.includes(s.id) && !dismissed.includes(s.id)
      );
    }
  }

  // If users provided, generate new suggestions
  if (users && Array.isArray(users) && users.length > 0) {
    const suggestions = generateSuggestions(users);
    saveSuggestionsToStorage(suggestions);
    return suggestions;
  }

  // Return cached even if expired (better than nothing)
  return getSuggestionsFromStorage();
}

/**
 * Dismiss a suggestion (user doesn't want to see it)
 * @param {string} userId - ID of the user to dismiss
 * @returns {Object} Result object
 */
export function dismissSuggestion(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const dismissed = getDismissedFromStorage();
  if (!dismissed.includes(userId)) {
    dismissed.push(userId);
    saveDismissedToStorage(dismissed);
  }

  // Also remove from cached suggestions
  const suggestions = getSuggestionsFromStorage();
  const filtered = suggestions.filter(s => s.id !== userId);
  saveSuggestionsToStorage(filtered);

  showToast(t('suggestionDismissed') || 'Suggestion ignoree', 'info');

  return { success: true };
}

/**
 * Get count of suggestions
 * @returns {number} Number of suggestions
 */
export function getSuggestionsCount() {
  const suggestions = getSuggestions();
  return suggestions.length;
}

/**
 * Clear all dismissed suggestions (to see them again)
 * @returns {Object} Result object
 */
export function clearDismissed() {
  saveDismissedToStorage([]);
  showToast(t('dismissedCleared') || 'Suggestions reinitialises', 'success');
  return { success: true };
}

/**
 * Refresh suggestions (force regenerate)
 * @param {Array} users - Array of all users
 * @returns {Array} New suggestions
 */
export function refreshSuggestions(users) {
  if (!users || !Array.isArray(users)) {
    return [];
  }

  // Clear cache time to force regeneration
  Storage.remove(SUGGESTIONS_CACHE_KEY);

  const suggestions = generateSuggestions(users);
  saveSuggestionsToStorage(suggestions);

  showToast(t('suggestionsRefreshed') || 'Suggestions mises a jour', 'success');

  return suggestions;
}

/**
 * Get suggestions filtered by reason
 * @param {string} reason - Reason to filter by
 * @returns {Array} Filtered suggestions
 */
export function getSuggestionsByReason(reason) {
  const suggestions = getSuggestions();
  return suggestions.filter(s => s.reason === reason);
}

/**
 * Get suggestion statistics
 * @returns {Object} Statistics object
 */
export function getSuggestionStats() {
  const suggestions = getSuggestions();
  const dismissed = getDismissedFromStorage();

  // Group by reason
  const byReason = {};
  suggestions.forEach(s => {
    byReason[s.reason] = (byReason[s.reason] || 0) + 1;
  });

  return {
    totalSuggestions: suggestions.length,
    totalDismissed: dismissed.length,
    byReason,
    avgScore: suggestions.length > 0
      ? Math.round(suggestions.reduce((sum, s) => sum + s.score, 0) / suggestions.length)
      : 0,
  };
}

/**
 * Add mock suggestions (for testing/demo)
 * @param {Array} mockSuggestions - Array of mock suggestion objects
 * @returns {Object} Result object
 */
export function addMockSuggestions(mockSuggestions) {
  if (!mockSuggestions || !Array.isArray(mockSuggestions)) {
    return { success: false, error: 'invalid_data' };
  }

  const suggestions = mockSuggestions.map(s => ({
    id: s.id,
    username: s.username || s.id,
    avatar: s.avatar || '',
    level: s.level || 1,
    checkins: s.checkins || 0,
    score: s.score || 50,
    reason: s.reason || SuggestionReason.ACTIVE_USER,
    mutualFriends: s.mutualFriends || 0,
    suggestedAt: new Date().toISOString(),
  }));

  saveSuggestionsToStorage(suggestions);

  return { success: true, count: suggestions.length };
}

/**
 * Clear all suggestions data
 * @returns {Object} Result object
 */
export function clearAllSuggestionsData() {
  saveSuggestionsToStorage([]);
  saveDismissedToStorage([]);
  Storage.remove(SUGGESTIONS_CACHE_KEY);

  showToast(t('suggestionsCleared') || 'Donnees des suggestions effacees', 'info');

  return { success: true };
}

/**
 * Render a suggestion card HTML
 * @param {Object} suggestion - Suggestion object
 * @returns {string} HTML string
 */
export function renderSuggestionCard(suggestion) {
  if (!suggestion || !suggestion.id) return '';

  const avatar = suggestion.avatar || '';
  const username = escapeHTML(suggestion.username || suggestion.id);
  const level = suggestion.level || 1;
  const reason = suggestion.reason || SuggestionReason.ACTIVE_USER;
  const mutualFriends = suggestion.mutualFriends || 0;

  return `
    <div
      class="suggestion-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-suggestion-id="${escapeHTML(suggestion.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
          ${avatar ? escapeHTML(avatar) : '<i class="fas fa-user text-white text-lg"></i>'}
        </div>
        <div>
          <div class="font-medium text-white">${username}</div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            <span class="flex items-center gap-1">
              <i class="fas fa-trophy text-yellow-400"></i>
              ${t('level') || 'Niveau'} ${level}
            </span>
            ${mutualFriends > 0 ? `
              <span class="text-slate-500">|</span>
              <span class="flex items-center gap-1">
                <i class="fas fa-user-friends text-primary-400"></i>
                ${mutualFriends} ${t('mutualFriends') || 'ami(s) en commun'}
              </span>
            ` : ''}
          </div>
          <div class="text-xs text-primary-400 flex items-center gap-1 mt-1">
            <i class="fas ${escapeHTML(getReasonIcon(reason))}"></i>
            <span>${escapeHTML(getReasonLabel(reason))}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick="sendFriendRequestFromSuggestion('${escapeHTML(suggestion.id)}', '${username}')"
          class="btn btn-sm btn-primary"
          aria-label="${t('addFriend') || 'Ajouter'}"
        >
          <i class="fas fa-user-plus mr-1"></i>
          ${t('addFriend') || 'Ajouter'}
        </button>
        <button
          onclick="dismissSuggestionHandler('${escapeHTML(suggestion.id)}')"
          class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
          aria-label="${t('dismiss') || 'Ignorer'}"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render the suggestions list HTML
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderSuggestionsList(options = {}) {
  const { limit = 5 } = options;
  const suggestions = getSuggestions().slice(0, limit);

  if (suggestions.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noSuggestions') || 'Pas de suggestions')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noSuggestionsDesc') || 'Continue a utiliser l\'app pour decouvrir des routards !')}</p>
      </div>
    `;
  }

  return `
    <div class="suggestions-list">
      <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <i class="fas fa-lightbulb text-yellow-400"></i>
        ${t('suggestedFriends') || 'Suggestions d\'amis'}
        <span class="ml-auto px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
          ${suggestions.length}
        </span>
      </h3>
      <div class="space-y-2" role="list" aria-label="${t('suggestedFriends') || 'Suggestions d\'amis'}">
        ${suggestions.map(s => renderSuggestionCard(s)).join('')}
      </div>
      ${getSuggestions().length > limit ? `
        <button
          onclick="showAllSuggestions()"
          class="btn btn-sm bg-white/10 hover:bg-white/20 text-white w-full mt-3"
        >
          ${t('showMore') || 'Voir plus'} (${getSuggestions().length - limit})
        </button>
      ` : ''}
    </div>
  `;
}

// Global handlers for onclick events
window.dismissSuggestionHandler = (userId) => {
  dismissSuggestion(userId);
};

window.sendFriendRequestFromSuggestion = (userId, username) => {
  // Import dynamically to avoid circular dependency
  import('./friendsList.js').then(({ sendFriendRequest }) => {
    const result = sendFriendRequest(userId, username);
    if (result.success) {
      // Remove from suggestions
      dismissSuggestion(userId);
    }
  });
};

window.showAllSuggestions = () => {
  setState({
    showAllSuggestions: true,
  });
};

window.refreshSuggestionsHandler = () => {
  // In a real app, this would fetch users from Firebase
  showToast(t('refreshingSuggestions') || 'Mise a jour des suggestions...', 'info');
};

// Export default with all functions
export default {
  SuggestionReason,
  generateSuggestions,
  getSuggestions,
  dismissSuggestion,
  getSuggestionsCount,
  clearDismissed,
  refreshSuggestions,
  getSuggestionsByReason,
  getSuggestionStats,
  addMockSuggestions,
  clearAllSuggestionsData,
  renderSuggestionCard,
  renderSuggestionsList,
};
