/**
 * Daily Reward Service
 * Handles daily login rewards with streak system
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints, addSeasonPoints } from './gamification.js';

// Reward calendar configuration
const DAILY_REWARDS = [
  { day: 1, points: 10, label: 'Jour 1', icon: '🎁' },
  { day: 2, points: 15, label: 'Jour 2', icon: '🎁' },
  { day: 3, points: 20, label: 'Jour 3', icon: '🎁' },
  { day: 4, points: 25, label: 'Jour 4', icon: '🎁' },
  { day: 5, points: 30, label: 'Jour 5', icon: '🎁' },
  { day: 6, points: 40, label: 'Jour 6', icon: '🎁' },
  { day: 7, points: null, label: 'Jour 7', icon: '🎁', isMystery: true }, // Mystery chest
];

// Possible badge rewards from mystery chest
const MYSTERY_BADGES = [
  { id: 'lucky_seven', name: 'Lucky Seven', icon: '🍀', rarity: 'rare' },
  { id: 'treasure_hunter', name: 'Chasseur de Tresor', icon: '🏴‍☠️', rarity: 'epic' },
  { id: 'daily_champion', name: 'Champion Quotidien', icon: '🏆', rarity: 'legendary' },
];

/**
 * Get the current daily reward streak info
 */
export function getDailyRewardInfo() {
  const state = getState();
  const {
    dailyRewardStreak = 0,
    lastDailyRewardClaim = null,
    dailyRewardProtection = false,
    dailyRewardsHistory = [],
  } = state;

  const today = new Date().toDateString();
  const lastClaim = lastDailyRewardClaim ? new Date(lastDailyRewardClaim).toDateString() : null;

  // Check if already claimed today
  const claimedToday = lastClaim === today;

  // Calculate current day in the cycle (1-7)
  let currentDay = (dailyRewardStreak % 7) + 1;
  if (claimedToday) {
    currentDay = dailyRewardStreak % 7 || 7; // Show claimed day
  }

  // Check if streak was broken (missed a day)
  let streakBroken = false;
  if (lastClaim && !claimedToday) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    streakBroken = lastClaim !== yesterday;
  }

  // Get reward for current day
  const reward = DAILY_REWARDS.find(r => r.day === currentDay) || DAILY_REWARDS[0];

  return {
    currentDay,
    totalStreak: dailyRewardStreak,
    claimedToday,
    streakBroken,
    hasProtection: dailyRewardProtection,
    reward,
    history: dailyRewardsHistory,
  };
}

/**
 * Check if user can claim today's reward
 */
export function canClaimReward() {
  const info = getDailyRewardInfo();
  return !info.claimedToday;
}

/**
 * Claim today's daily reward
 * @returns {Object} Claim result with points and possible bonus
 */
export function claimReward() {
  const state = getState();
  const info = getDailyRewardInfo();

  if (info.claimedToday) {
    return { success: false, message: 'Deja recupere aujourd\'hui !' };
  }

  let newStreak;
  let pointsEarned;
  let badgeEarned = null;
  let mysteryResult = null;

  // Handle streak logic
  if (info.streakBroken && !info.hasProtection) {
    // Streak broken - reset to day 1
    newStreak = 1;
    showToast('Serie perdue ! On recommence au jour 1', 'warning');
  } else if (info.streakBroken && info.hasProtection) {
    // Used protection to save streak
    newStreak = info.totalStreak + 1;
    setState({ dailyRewardProtection: false });
    showToast('Protection utilisee ! Ta serie est sauvee !', 'success');
  } else {
    // Continue streak
    newStreak = info.totalStreak + 1;
  }

  const currentDay = (newStreak - 1) % 7 + 1;
  const reward = DAILY_REWARDS.find(r => r.day === currentDay) || DAILY_REWARDS[0];

  // Calculate points
  if (reward.isMystery) {
    // Mystery chest - random 50-200 points
    mysteryResult = openMysteryChest();
    pointsEarned = mysteryResult.points;
    badgeEarned = mysteryResult.badge;
  } else {
    pointsEarned = reward.points;
  }

  // Update state
  const history = [...(state.dailyRewardsHistory || [])];
  history.push({
    day: currentDay,
    points: pointsEarned,
    badge: badgeEarned,
    date: new Date().toISOString(),
  });

  // Keep only last 30 days of history
  if (history.length > 30) {
    history.shift();
  }

  setState({
    dailyRewardStreak: newStreak,
    lastDailyRewardClaim: new Date().toISOString(),
    dailyRewardsHistory: history,
    showDailyReward: false,
    lastDailyRewardResult: {
      points: pointsEarned,
      badge: badgeEarned,
      day: currentDay,
      isMystery: reward.isMystery,
    },
  });

  // Award points
  addPoints(pointsEarned, 'daily_reward');
  addSeasonPoints(Math.floor(pointsEarned / 5));

  // Award badge if earned
  if (badgeEarned) {
    const badges = state.badges || [];
    if (!badges.includes(badgeEarned.id)) {
      setState({
        badges: [...badges, badgeEarned.id],
        newBadge: badgeEarned,
      });
    }
  }

  return {
    success: true,
    points: pointsEarned,
    badge: badgeEarned,
    day: currentDay,
    newStreak,
    isMystery: reward.isMystery,
    mysteryResult,
  };
}

/**
 * Open mystery chest (day 7 reward)
 * @returns {Object} Mystery chest contents
 */
function openMysteryChest() {
  // Random points between 50-200
  const points = Math.floor(Math.random() * 151) + 50;

  // 20% chance to get a badge
  let badge = null;
  if (Math.random() < 0.2) {
    badge = MYSTERY_BADGES[Math.floor(Math.random() * MYSTERY_BADGES.length)];
  }

  return {
    points,
    badge,
  };
}

/**
 * Get preview of all 7 days rewards
 */
export function getRewardsCalendar() {
  const info = getDailyRewardInfo();
  const claimedDays = (info.totalStreak % 7) || (info.claimedToday ? 7 : 0);

  return DAILY_REWARDS.map(reward => ({
    ...reward,
    claimed: reward.day <= claimedDays && info.claimedToday,
    current: reward.day === info.currentDay && !info.claimedToday,
    locked: reward.day > claimedDays + 1 || (info.claimedToday && reward.day > claimedDays),
  }));
}

export default {
  DAILY_REWARDS,
  getDailyRewardInfo,
  canClaimReward,
  claimReward,
  getRewardsCalendar,
};
