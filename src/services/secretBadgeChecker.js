/**
 * Secret Badge Checker Service
 * Checks and awards secret badges after each check-in
 */

import { getState, setState } from '../stores/state.js';
import { secretBadges, getSecretBadgeById } from '../data/secretBadges.js';
import { showToast } from './notifications.js';

/**
 * Build context for badge condition evaluation
 * @param {Object} spot - The spot being checked into
 * @param {Object} options - Additional options
 * @returns {Object} Context object for condition evaluation
 */
function buildCheckinContext(spot, options = {}) {
  const state = getState();
  const now = options.checkinDate || new Date();

  // Get checkins for today
  const today = now.toDateString();
  const checkinHistory = state.checkinHistory || [];
  const checkinsToday = checkinHistory.filter(c => {
    const cDate = new Date(c.timestamp);
    return cDate.toDateString() === today;
  }).length + 1; // +1 for current checkin

  // Get countries visited this week
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const countriesThisWeek = new Set(
    checkinHistory
      .filter(c => new Date(c.timestamp) >= oneWeekAgo)
      .map(c => c.country)
      .filter(Boolean)
  );
  // Add current spot's country
  if (spot?.country) {
    countriesThisWeek.add(spot.country);
  }

  // Get spot checkin counts
  const spotCheckins = state.spotCheckins || {};
  const currentSpotCheckins = (spotCheckins[spot?.id] || 0) + 1;

  // Get unique spots visited
  const visitedSpots = new Set(Object.keys(spotCheckins));
  if (spot?.id) {
    visitedSpots.add(spot.id);
  }

  return {
    // Time context
    checkinDate: now,
    checkinHour: now.getHours(),
    checkinMinute: now.getMinutes(),
    checkinDay: now.getDate(),

    // Spot context
    spotId: spot?.id,
    spotCountry: spot?.country,
    isFirstEverCheckin: options.isFirstEverCheckin || false,
    isFirstOnNewSpot: options.isFirstOnNewSpot || false,
    currentSpotCheckins,

    // User stats
    totalCheckins: (state.checkins || 0) + 1,
    checkinsToday,
    uniqueSpotsVisited: visitedSpots.size,
    countriesThisWeek: Array.from(countriesThisWeek),
    spotCheckins: { ...spotCheckins, [spot?.id]: currentSpotCheckins },
  };
}

/**
 * Show secret badge unlock notification with special animation
 * @param {Object} badge - The badge that was unlocked
 */
function showSecretBadgeUnlock(badge) {
  // Use enhanced animation if available
  if (window.showSuccessAnimation) {
    window.showSuccessAnimation(`BADGE SECRET DEBLOQUE !\n${badge.icon} ${badge.name}`, {
      emoji: '🔓',
      confetti: true,
    });
  } else {
    showToast(`🔓 BADGE SECRET DEBLOQUE ! ${badge.icon} ${badge.name}`, 'success', 8000);
  }

  // Store for modal display
  setState({
    newSecretBadge: badge,
    showSecretBadgePopup: true,
  });

  // Play unlock sound if available
  if (window.playSound) {
    window.playSound('unlock');
  }

  // Auto-hide after 8 seconds
  setTimeout(() => {
    setState({ showSecretBadgePopup: false, newSecretBadge: null });
  }, 8000);
}

/**
 * Check and award secret badges after a check-in
 * @param {Object} spot - The spot being checked into
 * @param {Object} options - Additional context options
 * @returns {Object[]} Array of newly unlocked badges
 */
export function checkSecretBadges(spot, options = {}) {
  const state = getState();
  const earnedSecretBadges = state.secretBadges || [];
  const context = buildCheckinContext(spot, options);

  const newBadges = [];

  for (const badge of secretBadges) {
    // Skip already earned badges
    if (earnedSecretBadges.includes(badge.id)) {
      continue;
    }

    // Check badge condition
    try {
      if (badge.condition(context)) {
        newBadges.push(badge);
        showSecretBadgeUnlock(badge);
      }
    } catch (error) {
      console.warn(`Error checking secret badge ${badge.id}:`, error);
    }
  }

  // Update state with new badges
  if (newBadges.length > 0) {
    const newBadgeIds = newBadges.map(b => b.id);

    setState({
      secretBadges: [...earnedSecretBadges, ...newBadgeIds],
    });

    // Award bonus points for each secret badge (100 points each)
    const bonusPoints = newBadges.reduce((sum, badge) => sum + badge.points, 0);

    if (bonusPoints > 0) {
      // Direct state update to avoid recursion
      const currentState = getState();
      setState({
        points: currentState.points + bonusPoints,
      });

      // Show points animation if available
      if (window.showPoints) {
        setTimeout(() => window.showPoints(bonusPoints), 500);
      }
    }
  }

  return newBadges;
}

/**
 * Update checkin history for tracking
 * @param {Object} spot - The spot checked into
 */
export function recordCheckinHistory(spot) {
  const state = getState();
  const history = state.checkinHistory || [];
  const spotCheckins = state.spotCheckins || {};

  // Add to history
  const newHistory = [
    ...history,
    {
      spotId: spot?.id,
      country: spot?.country,
      timestamp: new Date().toISOString(),
    },
  ].slice(-500); // Keep last 500 checkins

  // Update spot-specific counter
  const newSpotCheckins = {
    ...spotCheckins,
    [spot?.id]: (spotCheckins[spot?.id] || 0) + 1,
  };

  setState({
    checkinHistory: newHistory,
    spotCheckins: newSpotCheckins,
  });
}

/**
 * Get context for manual testing/debugging
 * @param {Object} spot - Test spot
 * @returns {Object} Current context
 */
export function getCheckinContext(spot) {
  return buildCheckinContext(spot);
}

/**
 * Force check a specific secret badge (for testing)
 * @param {string} badgeId - Badge ID to check
 * @param {Object} context - Context to use
 * @returns {boolean} Whether badge would be unlocked
 */
export function testSecretBadge(badgeId, context) {
  const badge = getSecretBadgeById(badgeId);
  if (!badge) return false;
  return badge.condition(context);
}

export default {
  checkSecretBadges,
  recordCheckinHistory,
  getCheckinContext,
  testSecretBadge,
};
