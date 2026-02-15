/**
 * Weekly Leaderboard Service
 * Manages weekly rankings with automatic reset every Monday at midnight
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';

// Storage key for weekly leaderboard data
const WEEKLY_LEADERBOARD_KEY = 'spothitch_weekly_leaderboard';
const WEEKLY_HISTORY_KEY = 'spothitch_weekly_history';

/**
 * Get the start of the current week (Monday at midnight)
 * @returns {Date} Start of current week
 */
export function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the current week (Sunday at 23:59:59)
 * @returns {Date} End of current week
 */
export function getWeekEnd() {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get time remaining until next reset (Monday at midnight)
 * @returns {Object} Object with days, hours, minutes, seconds
 */
export function getTimeUntilReset() {
  const now = new Date();
  const weekEnd = getWeekEnd();
  const diff = weekEnd.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Format time remaining as string
 * @returns {string} Formatted time remaining
 */
export function formatTimeRemaining() {
  const { days, hours, minutes } = getTimeUntilReset();

  if (days > 0) {
    return `${days}j ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Get week identifier (e.g., "2026-W05")
 * @param {Date} date - Date to get week for
 * @returns {string} Week identifier
 */
export function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Load weekly leaderboard data from storage
 * @returns {Object} Weekly leaderboard data
 */
function loadWeeklyData() {
  try {
    const data = localStorage.getItem(WEEKLY_LEADERBOARD_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading weekly leaderboard data:', e);
  }
  return {
    weekId: getWeekId(),
    weekStart: getWeekStart().toISOString(),
    participants: [],
  };
}

/**
 * Save weekly leaderboard data to storage
 * @param {Object} data - Data to save
 */
function saveWeeklyData(data) {
  try {
    localStorage.setItem(WEEKLY_LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving weekly leaderboard data:', e);
  }
}

/**
 * Load weekly history from storage
 * @returns {Array} Array of past week results
 */
export function loadWeeklyHistory() {
  try {
    const data = localStorage.getItem(WEEKLY_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading weekly history:', e);
  }
  return [];
}

/**
 * Save weekly history to storage
 * @param {Array} history - History to save
 */
function saveWeeklyHistory(history) {
  try {
    // Keep only last 10 weeks
    const trimmedHistory = history.slice(-10);
    localStorage.setItem(WEEKLY_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (e) {
    console.error('Error saving weekly history:', e);
  }
}

/**
 * Check if week has changed and reset if needed
 * @returns {boolean} True if reset occurred
 */
export function checkWeeklyReset() {
  const data = loadWeeklyData();
  const currentWeekId = getWeekId();

  if (data.weekId !== currentWeekId) {
    // Week has changed - archive old data and distribute rewards
    archiveWeekAndDistributeRewards(data);

    // Reset for new week
    const newData = {
      weekId: currentWeekId,
      weekStart: getWeekStart().toISOString(),
      participants: [],
    };
    saveWeeklyData(newData);

    return true;
  }

  return false;
}

/**
 * Archive completed week and distribute rewards
 * @param {Object} weekData - Completed week data
 */
function archiveWeekAndDistributeRewards(weekData) {
  if (!weekData.participants || weekData.participants.length === 0) {
    return;
  }

  // Sort by weekly points
  const sorted = [...weekData.participants].sort((a, b) => b.weeklyPoints - a.weeklyPoints);

  // Save to history
  const history = loadWeeklyHistory();
  history.push({
    weekId: weekData.weekId,
    weekStart: weekData.weekStart,
    topPlayers: sorted.slice(0, 10).map((p, index) => ({
      ...p,
      rank: index + 1,
    })),
  });
  saveWeeklyHistory(history);

  // Distribute rewards to current user if in top 10
  const state = getState();
  const currentUserId = state.user?.uid || 'local_user';
  const userRank = sorted.findIndex(p => p.id === currentUserId) + 1;

  if (userRank > 0 && userRank <= 10) {
    distributeWeeklyReward(userRank);
  }
}

/**
 * Distribute reward based on weekly rank
 * @param {number} rank - User's rank (1-10)
 */
function distributeWeeklyReward(rank) {
  const state = getState();
  let bonusPoints = 0;
  let message = '';

  if (rank === 1) {
    bonusPoints = 500;
    // Award badge
    const badges = state.badges || [];
    if (!badges.includes('weekly_champion')) {
      setState({ badges: [...badges, 'weekly_champion'] });
    }
    message = 'Champion de la semaine ! +500 👍 + Badge !';
  } else if (rank <= 3) {
    bonusPoints = 200;
    message = `Top 3 de la semaine ! +200 👍 !`;
  } else if (rank <= 10) {
    bonusPoints = 100;
    message = `Top 10 de la semaine ! +100 👍 !`;
  }

  if (bonusPoints > 0) {
    addPoints(bonusPoints, 'weekly_reward');
    showToast(message, 'success', 5000);

    // Trigger confetti for top 3
    if (rank <= 3 && window.launchConfetti) {
      window.launchConfetti();
    }
  }
}

/**
 * Add weekly points for current user
 * @param {number} points - Points to add
 * @param {string} reason - Reason for points
 */
export function addWeeklyPoints(points, reason = '') {
  checkWeeklyReset();

  const state = getState();
  const data = loadWeeklyData();

  const userId = state.user?.uid || 'local_user';
  const username = state.username || 'Voyageur';
  const avatar = state.avatar || '🤙';
  const level = state.level || 1;

  // Find or create participant entry
  let participant = data.participants.find(p => p.id === userId);

  if (participant) {
    participant.weeklyPoints += points;
    participant.username = username;
    participant.avatar = avatar;
    participant.level = level;
    participant.lastActivity = new Date().toISOString();
  } else {
    participant = {
      id: userId,
      username,
      avatar,
      level,
      weeklyPoints: points,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    data.participants.push(participant);
  }

  saveWeeklyData(data);

  // Update state with user's weekly points
  setState({
    weeklyPoints: participant.weeklyPoints,
  });

  return participant.weeklyPoints;
}

/**
 * Get current weekly leaderboard
 * @returns {Array} Sorted leaderboard entries
 */
export function getWeeklyLeaderboard() {
  checkWeeklyReset();

  const data = loadWeeklyData();

  // Add mock players for demo if not many participants
  let participants = [...data.participants];

  if (participants.length < 10) {
    const mockPlayers = generateMockPlayers();
    participants = [...participants, ...mockPlayers].slice(0, 50);
  }

  // Sort by weekly points (descending)
  return participants.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
}

/**
 * Get current user's weekly rank
 * @returns {Object} User's rank info
 */
export function getUserWeeklyRank() {
  const state = getState();
  const leaderboard = getWeeklyLeaderboard();
  const userId = state.user?.uid || 'local_user';

  const rank = leaderboard.findIndex(p => p.id === userId) + 1;
  const user = leaderboard.find(p => p.id === userId);

  return {
    rank: rank || null,
    weeklyPoints: user?.weeklyPoints || state.weeklyPoints || 0,
    isInTop10: rank > 0 && rank <= 10,
  };
}

/**
 * Generate mock players for demo
 * @returns {Array} Mock player entries
 */
function generateMockPlayers() {
  const mockNames = [
    { username: 'RoadRunner', avatar: '🏃', level: 15 },
    { username: 'ThumbsUp', avatar: '👍', level: 14 },
    { username: 'WanderlustPro', avatar: '🌍', level: 13 },
    { username: 'FreeSoul', avatar: '✌️', level: 12 },
    { username: 'HitchKing', avatar: '👑', level: 11 },
    { username: 'Nomad42', avatar: '🎒', level: 10 },
    { username: 'RoadTripper', avatar: '🚗', level: 9 },
    { username: 'Backpacker', avatar: '🧳', level: 8 },
    { username: 'Explorer99', avatar: '🧭', level: 7 },
    { username: 'Adventurer', avatar: '⛺', level: 6 },
    { username: 'TrailBlazer', avatar: '🔥', level: 12 },
    { username: 'SunChaser', avatar: '🌞', level: 8 },
    { username: 'WindRider', avatar: '💨', level: 9 },
    { username: 'StarsNavigator', avatar: '⭐', level: 11 },
    { username: 'MountainGoat', avatar: '🐐', level: 10 },
  ];

  return mockNames.map((player, index) => ({
    id: `mock_${index}`,
    ...player,
    weeklyPoints: Math.floor(Math.random() * 800) + 100,
    lastActivity: new Date().toISOString(),
  }));
}

/**
 * Get weekly leaderboard rules
 * @returns {Array} Array of rule objects
 */
export function getWeeklyRules() {
  return [
    { icon: '📅', text: 'Le classement se reinitialise chaque lundi a minuit' },
    { icon: '⭐', text: 'Gagnez des 👍 en faisant des check-ins, ajoutant des spots, etc.' },
    { icon: '🥇', text: 'Top 1 : 500 👍 bonus + badge "Champion de la semaine"' },
    { icon: '🥈', text: 'Top 3 : 200 👍 bonus' },
    { icon: '🔟', text: 'Top 10 : 100 👍 bonus' },
    { icon: '📊', text: 'L\'historique des semaines precedentes est conserve' },
  ];
}

/**
 * Get rewards preview
 * @returns {Array} Array of reward objects
 */
export function getWeeklyRewards() {
  return [
    {
      rank: 1,
      icon: '🥇',
      label: 'Top 1',
      rewards: [
        { icon: '💰', text: '+500 👍' },
        { icon: '🏆', text: 'Badge "Champion de la semaine"' },
      ],
      color: 'amber',
    },
    {
      rank: 3,
      icon: '🥈',
      label: 'Top 2-3',
      rewards: [
        { icon: '💰', text: '+200 👍' },
      ],
      color: 'gray',
    },
    {
      rank: 10,
      icon: '🔟',
      label: 'Top 4-10',
      rewards: [
        { icon: '💰', text: '+100 👍' },
      ],
      color: 'orange',
    },
  ];
}

// Initialize weekly tracking on app load
export function initWeeklyLeaderboard() {
  checkWeeklyReset();

  // Schedule periodic check every minute
  setInterval(() => {
    checkWeeklyReset();
  }, 60000);
}

export default {
  getWeekStart,
  getWeekEnd,
  getTimeUntilReset,
  formatTimeRemaining,
  getWeekId,
  checkWeeklyReset,
  addWeeklyPoints,
  getWeeklyLeaderboard,
  getUserWeeklyRank,
  loadWeeklyHistory,
  getWeeklyRules,
  getWeeklyRewards,
  initWeeklyLeaderboard,
};
