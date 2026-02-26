/**
 * Gamification Service
 * Handles points, leagues, badges, and VIP levels
 */

import { getState, setState } from '../stores/state.js';
import { allBadges, getBadgeById } from '../data/badges.js';
import { leagues, getLeague, getVipLevel, getNextVipLevel } from '../data/vip-levels.js';
import { getTitleForLevel, checkTitleChange, getTitleProgress, getUnlockedTitles, getLockedTitles, getAllTitles } from '../data/titles.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

/**
 * Add points to user's total
 * @param {number} pts - Points to add
 * @param {string} reason - Reason for points (for logging)
 */
export function addPoints(pts, _reason = '') {
  const state = getState();
  const vipLevel = getVipLevel(state.points);
  const multipliedPts = Math.floor(pts * vipLevel.xpMultiplier);

  const newPoints = state.points + multipliedPts;
  const newLevel = Math.floor(newPoints / 100) + 1;
  const leveledUp = newLevel > state.level;
  const oldLevel = state.level;

  setState({
    points: newPoints,
    level: Math.max(state.level, newLevel),
  });

  // Show points animation
  if (window.showPoints && multipliedPts > 0) {
    window.showPoints(multipliedPts);
  }

  if (leveledUp) {
    // Use enhanced level up animation if available
    if (window.showLevelUp) {
      window.showLevelUp(newLevel);
    } else {
      showToast(t('levelReached') || `Niveau ${newLevel} atteint !`, 'success');
    }

    // Check for title change
    const newTitle = checkTitleChange(oldLevel, newLevel);
    if (newTitle) {
      showTitleUnlock(newTitle);
    }
  }

  // Check for VIP level up
  const newVipLevel = getVipLevel(newPoints);
  if (newVipLevel.id !== vipLevel.id) {
    if (window.showSuccessAnimation) {
      window.showSuccessAnimation((t('newVipLevel') || 'Nouveau niveau VIP :') + ` ${newVipLevel.name} !`, {
        emoji: newVipLevel.icon,
        confetti: true,
      });
    } else {
      showToast(`${newVipLevel.icon} ${t('newVipLevel') || 'Nouveau niveau VIP :'} ${newVipLevel.name} !`, 'success');
    }
  }

  // Check badges
  checkBadges();

  return multipliedPts;
}

/**
 * Add seasonal points (for league ranking)
 * @param {number} pts - Season points to add
 */
export function addSeasonPoints(pts) {
  const state = getState();
  const currentLeague = getLeague(state.seasonPoints || 0);
  const newSeasonPoints = (state.seasonPoints || 0) + pts;

  setState({
    seasonPoints: newSeasonPoints,
  });

  // Check for league promotion
  const newLeague = getLeague(newSeasonPoints);
  if (newLeague.id !== currentLeague.id) {
    showToast(`${newLeague.icon} ${t('promotedToLeague') || 'Promu en ligue'} ${newLeague.name} !`, 'success');
  }

  return newSeasonPoints;
}

/**
 * Update user's league based on season points
 */
function updateLeague() {
  const state = getState();
  const league = getLeague(state.seasonPoints || 0);

  if (state.league !== league.id) {
    setState({ league: league.id });
  }

  return league;
}

/**
 * Get league info
 * @param {string} leagueId - League ID
 */
function getLeagueInfo(leagueId) {
  return leagues.find(l => l.id === leagueId) || leagues[0];
}

/**
 * Get user's current VIP level
 */
function getUserVipLevel() {
  const state = getState();
  return getVipLevel(state.points);
}

/**
 * Get user's next VIP level
 */
function getNextUserVipLevel() {
  const state = getState();
  return getNextVipLevel(state.points);
}

/**
 * Get VIP progress info
 */
function getVipProgressInfo() {
  const state = getState();
  const current = getVipLevel(state.points);
  const next = getNextVipLevel(state.points);

  if (!next) {
    return {
      current,
      next: null,
      progress: 1,
      pointsNeeded: 0,
      pointsInLevel: state.points - current.minPoints,
    };
  }

  const levelRange = current.maxPoints - current.minPoints + 1;
  const pointsInLevel = state.points - current.minPoints;
  const progress = pointsInLevel / levelRange;

  return {
    current,
    next,
    progress,
    pointsNeeded: next.minPoints - state.points,
    pointsInLevel,
  };
}

/**
 * Check and award new badges
 */
export function checkBadges() {
  const state = getState();
  const earnedBadges = state.badges || [];

  const userStats = {
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    reviewsGiven: state.reviewsGiven || 0,
    countriesVisited: state.countriesVisited || 0,
    nightCheckin: state.nightCheckin || false,
    earlyCheckin: state.earlyCheckin || false,
    helpfulMessages: state.helpfulMessages || 0,
    perfectQuiz: state.perfectQuiz || false,
    verifiedSpots: state.verifiedSpots || 0,
  };

  const newBadges = [];

  for (const badge of allBadges) {
    if (!earnedBadges.includes(badge.id) && badge.condition(userStats)) {
      newBadges.push(badge.id);
      showBadgePopup(badge);
    }
  }

  if (newBadges.length > 0) {
    setState({
      badges: [...earnedBadges, ...newBadges],
    });

    // Award bonus points for badges
    const bonusPoints = newBadges.reduce((sum, badgeId) => {
      const badge = getBadgeById(badgeId);
      return sum + (badge?.points || 0);
    }, 0);

    if (bonusPoints > 0) {
      // Direct state update to avoid recursion
      const currentState = getState();
      setState({
        points: currentState.points + bonusPoints,
      });
    }
  }

  return newBadges;
}

/**
 * Show badge popup notification
 * @param {Object} badge - Badge object
 */
function showBadgePopup(badge) {
  // Use the enhanced animation if available, otherwise fallback to toast
  if (window.showBadgeUnlock) {
    window.showBadgeUnlock(badge);
  } else {
    showToast(`${badge.icon} ${t('badgeUnlocked') || 'Badge débloqué :'} ${badge.name}`, 'success', 5000);
  }

  // Store for modal display
  setState({
    newBadge: badge,
    showBadgePopup: true,
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    setState({ showBadgePopup: false, newBadge: null });
  }, 5000);
}

/**
 * Show title unlock notification
 * @param {Object} title - Title object
 */
function showTitleUnlock(title) {
  // Use the enhanced animation if available, otherwise fallback to toast
  if (window.showTitleUnlock) {
    window.showTitleUnlock(title);
  } else if (window.showSuccessAnimation) {
    window.showSuccessAnimation((t('newTitle') || 'Nouveau titre :') + ` ${title.name} !`, {
      emoji: title.emoji,
      confetti: true,
    });
  } else {
    showToast(`${title.emoji} ${t('newTitle') || 'Nouveau titre :'} ${title.name} !`, 'success', 5000);
  }

  // Store for modal display
  setState({
    newTitle: title,
    showTitlePopup: true,
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    setState({ showTitlePopup: false, newTitle: null });
  }, 5000);
}

/**
 * Get user's current title based on level
 * @returns {Object} Current title object
 */
function getUserTitle() {
  const state = getState();
  return getTitleForLevel(state.level || 1);
}

/**
 * Get user's title progress info
 * @returns {Object} Title progress info
 */
function getUserTitleProgress() {
  const state = getState();
  return getTitleProgress(state.level || 1);
}

/**
 * Get all unlocked titles for current user
 * @returns {Object[]} Array of unlocked titles
 */
function getUserUnlockedTitles() {
  const state = getState();
  return getUnlockedTitles(state.level || 1);
}

/**
 * Get all locked titles for current user
 * @returns {Object[]} Array of locked titles
 */
function getUserLockedTitles() {
  const state = getState();
  return getLockedTitles(state.level || 1);
}

/**
 * Increment checkin count and award points
 */
function recordCheckin() {
  const state = getState();
  const hour = new Date().getHours();

  // Check for special time-based badges
  const updates = {
    checkins: (state.checkins || 0) + 1,
  };

  if (hour >= 0 && hour < 5) {
    updates.nightCheckin = true;
  }
  if (hour >= 5 && hour < 7) {
    updates.earlyCheckin = true;
  }

  setState(updates);
  addPoints(5, 'checkin');
  addSeasonPoints(2);

  return updates.checkins;
}

/**
 * Increment spots created count
 */
function recordSpotCreated() {
  const state = getState();
  setState({
    spotsCreated: (state.spotsCreated || 0) + 1,
  });
  addPoints(20, 'spot_created');
  addSeasonPoints(10);
}

/**
 * Increment reviews given count
 */
function recordReview() {
  const state = getState();
  setState({
    reviewsGiven: (state.reviewsGiven || 0) + 1,
  });
  addPoints(10, 'review');
  addSeasonPoints(5);
}

/**
 * Record country visit
 * @param {string} countryCode - Country code
 */
function recordCountryVisit(countryCode) {
  const state = getState();
  const visited = state.visitedCountries || [];

  if (!visited.includes(countryCode)) {
    const newVisited = [...visited, countryCode];
    setState({
      visitedCountries: newVisited,
      countriesVisited: newVisited.length,
    });
    addPoints(15, 'new_country');
    checkBadges();
  }
}

/**
 * Get gamification summary for profile
 */
export function getGamificationSummary() {
  const state = getState();
  const vipLevel = getVipLevel(state.points);
  const league = getLeague(state.seasonPoints || 0);
  const nextVip = getNextVipLevel(state.points);
  const title = getTitleForLevel(state.level || 1);
  const titleProgress = getTitleProgress(state.level || 1);

  return {
    points: state.points,
    level: state.level,
    title,
    titleProgress,
    vipLevel,
    league,
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    reviewsGiven: state.reviewsGiven || 0,
    badgesCount: (state.badges || []).length,
    totalBadges: allBadges.length,
    nextVip,
    pointsToNextVip: nextVip ? nextVip.minPoints - state.points : 0,
    unlockedTitles: getUnlockedTitles(state.level || 1),
    lockedTitles: getLockedTitles(state.level || 1),
    totalTitles: getAllTitles().length,
  };
}

export default {
  addPoints,
  addSeasonPoints,
  updateLeague,
  getLeagueInfo,
  getUserVipLevel,
  getNextUserVipLevel,
  getVipProgressInfo,
  checkBadges,
  recordCheckin,
  recordSpotCreated,
  recordReview,
  recordCountryVisit,
  getGamificationSummary,
  // Title exports
  getUserTitle,
  getUserTitleProgress,
  getUserUnlockedTitles,
  getUserLockedTitles,
};
