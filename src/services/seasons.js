/**
 * Seasons Service
 * Manages seasonal competitions with periodic reset (every 3 months)
 * Leaderboards reset each season, but cosmetic rewards (skins, frames, badges) are kept permanently
 * Feature #160
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { unlockFrame, unlockTitle } from './profileCustomization.js';
import { icon } from '../utils/icons.js'

// Storage keys
const SEASON_DATA_KEY = 'spothitch_season_data';
const SEASON_HISTORY_KEY = 'spothitch_season_history';
const SEASON_REWARDS_KEY = 'spothitch_season_rewards';

/**
 * Season definitions - each season lasts 3 months
 */
export const SEASON_DEFINITIONS = {
  spring: {
    id: 'spring',
    name: 'Printemps',
    nameEn: 'Spring',
    icon: '🌸',
    months: [3, 4, 5], // March, April, May
    color: '#10b981', // green
    gradient: 'from-green-400 to-emerald-500',
    theme: 'Le reveil des routes',
    themeEn: 'The Awakening Roads',
  },
  summer: {
    id: 'summer',
    name: 'Ete',
    nameEn: 'Summer',
    icon: '☀️',
    months: [6, 7, 8], // June, July, August
    color: '#f59e0b', // amber
    gradient: 'from-amber-400 to-orange-500',
    theme: 'Aventure estivale',
    themeEn: 'Summer Adventure',
  },
  autumn: {
    id: 'autumn',
    name: 'Automne',
    nameEn: 'Autumn',
    icon: '🍂',
    months: [9, 10, 11], // September, October, November
    color: '#f97316', // orange
    gradient: 'from-orange-400 to-red-500',
    theme: 'Routes dorees',
    themeEn: 'Golden Roads',
  },
  winter: {
    id: 'winter',
    name: 'Hiver',
    nameEn: 'Winter',
    icon: '❄️',
    months: [12, 1, 2], // December, January, February
    color: '#3b82f6', // blue
    gradient: 'from-blue-400 to-cyan-500',
    theme: 'Defier le froid',
    themeEn: 'Brave the Cold',
  },
};

/**
 * Season reward tiers
 */
export const SEASON_REWARD_TIERS = [
  {
    id: 'tier_1',
    name: 'Debutant',
    nameEn: 'Beginner',
    minPoints: 0,
    icon: '🥉',
    rewards: [
      { type: 'points', amount: 100, name: 'Bonus points' },
    ],
  },
  {
    id: 'tier_2',
    name: 'Explorateur',
    nameEn: 'Explorer',
    minPoints: 500,
    icon: '🥈',
    rewards: [
      { type: 'points', amount: 300, name: 'Bonus points' },
      { type: 'badge', id: 'season_explorer', name: 'Explorateur saisonnier' },
    ],
  },
  {
    id: 'tier_3',
    name: 'Aventurier',
    nameEn: 'Adventurer',
    minPoints: 1500,
    icon: '🥇',
    rewards: [
      { type: 'points', amount: 500, name: 'Bonus points' },
      { type: 'badge', id: 'season_adventurer', name: 'Aventurier saisonnier' },
      { type: 'title', id: 'season_warrior', name: 'Guerrier saisonnier' },
    ],
  },
  {
    id: 'tier_4',
    name: 'Champion',
    nameEn: 'Champion',
    minPoints: 3000,
    icon: '🏆',
    rewards: [
      { type: 'points', amount: 1000, name: 'Bonus points' },
      { type: 'badge', id: 'season_champion', name: 'Champion saisonnier' },
      { type: 'frame', id: 'season_frame', name: 'Cadre saisonnier' },
      { type: 'skin', id: 'season_skin', name: 'Skin exclusif' },
    ],
  },
  {
    id: 'tier_5',
    name: 'Legende',
    nameEn: 'Legend',
    minPoints: 5000,
    icon: '👑',
    rewards: [
      { type: 'points', amount: 2000, name: 'Bonus points' },
      { type: 'badge', id: 'season_legend', name: 'Legende saisonniere' },
      { type: 'frame', id: 'season_legendary_frame', name: 'Cadre legendaire' },
      { type: 'skin', id: 'season_legendary_skin', name: 'Skin legendaire' },
      { type: 'title', id: 'season_legend_title', name: 'Legende de la saison' },
    ],
  },
];

/**
 * Get current season ID from date
 * @param {Date} date - Date to check (defaults to now)
 * @returns {string} Season ID
 */
export function getSeasonIdFromDate(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Get season year identifier (e.g., "2026-spring")
 * @param {Date} date - Date to check
 * @returns {string} Season identifier
 */
export function getSeasonIdentifier(date = new Date()) {
  const seasonId = getSeasonIdFromDate(date);
  let year = date.getFullYear();

  // For winter, if we're in Jan or Feb, the season started in previous year
  if (seasonId === 'winter' && date.getMonth() < 2) {
    year -= 1;
  }

  return `${year}-${seasonId}`;
}

/**
 * Get current season info
 * @returns {Object} Current season details
 */
export function getCurrentSeason() {
  const seasonId = getSeasonIdFromDate();
  const identifier = getSeasonIdentifier();
  const definition = SEASON_DEFINITIONS[seasonId];

  return {
    ...definition,
    identifier,
    year: parseInt(identifier.split('-')[0]),
    startDate: getSeasonStartDate(seasonId),
    endDate: getSeasonEndDate(seasonId),
  };
}

/**
 * Get season start date
 * @param {string} seasonId - Season ID
 * @param {number} year - Year (optional)
 * @returns {Date} Season start date
 */
export function getSeasonStartDate(seasonId, year = new Date().getFullYear()) {
  const season = SEASON_DEFINITIONS[seasonId];
  if (!season) return new Date();

  const startMonth = Math.min(...season.months);
  const adjustedYear = seasonId === 'winter' && startMonth === 12 ? year : year;

  return new Date(adjustedYear, startMonth - 1, 1, 0, 0, 0, 0);
}

/**
 * Get season end date
 * @param {string} seasonId - Season ID
 * @param {number} year - Year (optional)
 * @returns {Date} Season end date
 */
export function getSeasonEndDate(seasonId, year = new Date().getFullYear()) {
  const season = SEASON_DEFINITIONS[seasonId];
  if (!season) return new Date();

  const endMonth = Math.max(...season.months);
  const adjustedYear = seasonId === 'winter' && endMonth <= 2 ? year + 1 : year;

  // Last day of the month
  const nextMonth = new Date(adjustedYear, endMonth, 1);
  return new Date(nextMonth.getTime() - 1);
}

/**
 * Get time remaining in current season
 * @returns {Object} Time remaining {days, hours, minutes, expired}
 */
export function getSeasonTimeRemaining() {
  const season = getCurrentSeason();
  const now = new Date();
  const diff = season.endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Format time remaining as string
 * @returns {string} Formatted time
 */
export function formatSeasonTimeRemaining() {
  const { days, hours, minutes, expired } = getSeasonTimeRemaining();

  if (expired) return 'Saison terminee';
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Load season data from storage
 * @returns {Object} Season data
 */
function loadSeasonData() {
  try {
    const data = localStorage.getItem(SEASON_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading season data:', e);
  }

  const identifier = getSeasonIdentifier();
  return {
    seasonIdentifier: identifier,
    seasonPoints: 0,
    participants: [],
    joinedAt: null,
  };
}

/**
 * Save season data to storage
 * @param {Object} data - Data to save
 */
function saveSeasonData(data) {
  try {
    localStorage.setItem(SEASON_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving season data:', e);
  }
}

/**
 * Load season history
 * @returns {Array} Array of past season results
 */
export function loadSeasonHistory() {
  try {
    const data = localStorage.getItem(SEASON_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading season history:', e);
  }
  return [];
}

/**
 * Save season history
 * @param {Array} history - History to save
 */
function saveSeasonHistory(history) {
  try {
    // Keep only last 8 seasons (2 years)
    const trimmedHistory = history.slice(-8);
    localStorage.setItem(SEASON_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (e) {
    console.error('Error saving season history:', e);
  }
}

/**
 * Load permanently claimed rewards
 * @returns {Object} Claimed rewards by season
 */
export function loadClaimedRewards() {
  try {
    const data = localStorage.getItem(SEASON_REWARDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading claimed rewards:', e);
  }
  return {};
}

/**
 * Save claimed rewards
 * @param {Object} rewards - Rewards to save
 */
function saveClaimedRewards(rewards) {
  try {
    localStorage.setItem(SEASON_REWARDS_KEY, JSON.stringify(rewards));
  } catch (e) {
    console.error('Error saving claimed rewards:', e);
  }
}

/**
 * Check if season has changed and reset if needed
 * @returns {boolean} True if reset occurred
 */
export function checkSeasonReset() {
  const data = loadSeasonData();
  const currentIdentifier = getSeasonIdentifier();

  if (data.seasonIdentifier !== currentIdentifier) {
    // Season changed - archive and reset
    archiveSeasonAndDistributeRewards(data);

    // Reset for new season
    const newData = {
      seasonIdentifier: currentIdentifier,
      seasonPoints: 0,
      participants: [],
      joinedAt: null,
    };
    saveSeasonData(newData);

    // Reset season points in state but keep cosmetics
    setState({ seasonPoints: 0 });

    showToast('Nouvelle saison ! Les classements sont reinitialises.', 'info');

    return true;
  }

  return false;
}

/**
 * Archive completed season and distribute final rewards
 * @param {Object} seasonData - Completed season data
 */
function archiveSeasonAndDistributeRewards(seasonData) {
  if (!seasonData.participants || seasonData.participants.length === 0) {
    // Still archive even if empty
    const history = loadSeasonHistory();
    history.push({
      seasonIdentifier: seasonData.seasonIdentifier,
      topPlayers: [],
      endedAt: new Date().toISOString(),
    });
    saveSeasonHistory(history);
    return;
  }

  // Sort by season points
  const sorted = [...seasonData.participants].sort((a, b) => b.seasonPoints - a.seasonPoints);

  // Save to history
  const history = loadSeasonHistory();
  history.push({
    seasonIdentifier: seasonData.seasonIdentifier,
    topPlayers: sorted.slice(0, 20).map((p, index) => ({
      ...p,
      rank: index + 1,
    })),
    endedAt: new Date().toISOString(),
  });
  saveSeasonHistory(history);

  // Auto-distribute rewards to current user
  const state = getState();
  const currentUserId = state.user?.uid || 'local_user';
  const userEntry = sorted.find(p => p.id === currentUserId);

  if (userEntry) {
    autoDistributeSeasonRewards(seasonData.seasonIdentifier, userEntry.seasonPoints);
  }
}

/**
 * Auto-distribute season rewards based on points earned
 * @param {string} seasonIdentifier - Season ID
 * @param {number} seasonPoints - Points earned
 */
function autoDistributeSeasonRewards(seasonIdentifier, seasonPoints) {
  const claimedRewards = loadClaimedRewards();

  if (claimedRewards[seasonIdentifier]?.autoDistributed) {
    return; // Already distributed
  }

  const tier = getRewardTier(seasonPoints);
  if (!tier) return;

  let bonusPoints = 0;

  // Distribute all rewards up to and including current tier
  for (const t of SEASON_REWARD_TIERS) {
    if (t.minPoints > seasonPoints) break;

    for (const reward of t.rewards) {
      if (reward.type === 'points') {
        bonusPoints += reward.amount;
      } else if (reward.type === 'badge') {
        const state = getState();
        const badges = state.badges || [];
        const badgeId = `${reward.id}_${seasonIdentifier}`;
        if (!badges.includes(badgeId)) {
          setState({ badges: [...badges, badgeId] });
        }
      } else if (reward.type === 'frame') {
        const frameId = `${reward.id}_${seasonIdentifier}`;
        try {
          unlockFrame(frameId);
        } catch (e) {
          // Frame system not available
        }
      } else if (reward.type === 'title') {
        const titleId = `${reward.id}_${seasonIdentifier}`;
        try {
          unlockTitle(titleId);
        } catch (e) {
          // Title system not available
        }
      }
      // Skins are stored separately
    }
  }

  if (bonusPoints > 0) {
    addPoints(bonusPoints, 'season_end_reward');
  }

  // Mark as distributed
  claimedRewards[seasonIdentifier] = {
    ...claimedRewards[seasonIdentifier],
    autoDistributed: true,
    autoDistributedAt: new Date().toISOString(),
    tierReached: tier.id,
    pointsEarned: seasonPoints,
  };
  saveClaimedRewards(claimedRewards);

  showToast(`Recompenses de saison distribuees ! Niveau ${tier.name} atteint.`, 'success');
}

/**
 * Get user's season progress
 * @returns {Object} Season progress info
 */
export function getSeasonProgress() {
  checkSeasonReset();

  const data = loadSeasonData();
  const state = getState();
  const userId = state.user?.uid || 'local_user';

  const userEntry = data.participants.find(p => p.id === userId);
  const seasonPoints = userEntry?.seasonPoints || state.seasonPoints || 0;

  const currentTier = getRewardTier(seasonPoints);
  const nextTier = getNextRewardTier(seasonPoints);

  let progressToNextTier = 1;
  let pointsToNextTier = 0;

  if (nextTier) {
    const currentMin = currentTier?.minPoints || 0;
    const nextMin = nextTier.minPoints;
    const range = nextMin - currentMin;
    const pointsInTier = seasonPoints - currentMin;
    progressToNextTier = range > 0 ? pointsInTier / range : 1;
    pointsToNextTier = nextMin - seasonPoints;
  }

  return {
    seasonPoints,
    currentTier,
    nextTier,
    progressToNextTier: Math.min(1, Math.max(0, progressToNextTier)),
    pointsToNextTier,
    isMaxTier: !nextTier,
    timeRemaining: getSeasonTimeRemaining(),
    season: getCurrentSeason(),
  };
}

/**
 * Get reward tier for points
 * @param {number} points - Points to check
 * @returns {Object|null} Reward tier
 */
export function getRewardTier(points) {
  let tier = null;
  for (const t of SEASON_REWARD_TIERS) {
    if (points >= t.minPoints) {
      tier = t;
    }
  }
  return tier;
}

/**
 * Get next reward tier
 * @param {number} points - Current points
 * @returns {Object|null} Next tier or null if max
 */
export function getNextRewardTier(points) {
  for (const tier of SEASON_REWARD_TIERS) {
    if (points < tier.minPoints) {
      return tier;
    }
  }
  return null;
}

/**
 * Get all season rewards for display
 * @returns {Array} All reward tiers with status
 */
export function getSeasonRewards() {
  const progress = getSeasonProgress();
  const claimedRewards = loadClaimedRewards();
  const season = getCurrentSeason();

  return SEASON_REWARD_TIERS.map(tier => {
    const isUnlocked = progress.seasonPoints >= tier.minPoints;
    const isClaimed = claimedRewards[season.identifier]?.claimedTiers?.includes(tier.id);

    return {
      ...tier,
      isUnlocked,
      isClaimed,
      canClaim: isUnlocked && !isClaimed,
    };
  });
}

/**
 * Claim a specific season reward
 * @param {string} rewardId - Tier ID to claim
 * @returns {Object|null} Claimed rewards or null
 */
export function claimSeasonReward(rewardId) {
  const progress = getSeasonProgress();
  const tier = SEASON_REWARD_TIERS.find(t => t.id === rewardId);

  if (!tier) {
    showToast('Recompense introuvable', 'error');
    return null;
  }

  if (progress.seasonPoints < tier.minPoints) {
    showToast('Niveau insuffisant pour cette recompense', 'error');
    return null;
  }

  const season = getCurrentSeason();
  const claimedRewards = loadClaimedRewards();

  if (!claimedRewards[season.identifier]) {
    claimedRewards[season.identifier] = { claimedTiers: [] };
  }

  if (claimedRewards[season.identifier].claimedTiers?.includes(tier.id)) {
    showToast('Recompense deja reclamee', 'info');
    return null;
  }

  // Claim rewards
  const claimedItems = [];
  const state = getState();

  for (const reward of tier.rewards) {
    if (reward.type === 'points') {
      addPoints(reward.amount, 'season_reward');
      claimedItems.push({ type: 'points', amount: reward.amount });
    } else if (reward.type === 'badge') {
      const badges = state.badges || [];
      const badgeId = `${reward.id}_${season.identifier}`;
      if (!badges.includes(badgeId)) {
        setState({ badges: [...badges, badgeId] });
      }
      claimedItems.push({ type: 'badge', id: badgeId, name: reward.name });
    } else if (reward.type === 'frame') {
      const frameId = `${reward.id}_${season.identifier}`;
      try {
        unlockFrame(frameId);
      } catch (e) {
        // Frame system might not be available
      }
      claimedItems.push({ type: 'frame', id: frameId, name: reward.name });
    } else if (reward.type === 'title') {
      const titleId = `${reward.id}_${season.identifier}`;
      try {
        unlockTitle(titleId);
      } catch (e) {
        // Title system might not be available
      }
      claimedItems.push({ type: 'title', id: titleId, name: reward.name });
    } else if (reward.type === 'skin') {
      const skinId = `${reward.id}_${season.identifier}`;
      const skins = state.unlockedSkins || [];
      if (!skins.includes(skinId)) {
        setState({ unlockedSkins: [...skins, skinId] });
      }
      claimedItems.push({ type: 'skin', id: skinId, name: reward.name });
    }
  }

  // Mark as claimed
  claimedRewards[season.identifier].claimedTiers = [
    ...(claimedRewards[season.identifier].claimedTiers || []),
    tier.id,
  ];
  claimedRewards[season.identifier].lastClaimedAt = new Date().toISOString();
  saveClaimedRewards(claimedRewards);

  showToast(`Recompenses ${tier.name} reclamees !`, 'success');

  // Trigger confetti for high tiers
  if (tier.minPoints >= 3000 && window.launchConfetti) {
    window.launchConfetti();
  }

  return claimedItems;
}

/**
 * Add season points
 * @param {number} points - Points to add
 * @param {string} reason - Reason for points
 * @returns {number} New total
 */
export function addSeasonPoints(points, reason = '') {
  checkSeasonReset();

  const state = getState();
  const data = loadSeasonData();
  const userId = state.user?.uid || 'local_user';
  const username = state.username || 'Voyageur';
  const avatar = state.avatar || '🤙';
  const level = state.level || 1;

  // Find or create participant
  let participant = data.participants.find(p => p.id === userId);

  if (participant) {
    participant.seasonPoints += points;
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
      seasonPoints: points,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    data.participants.push(participant);
    data.joinedAt = participant.joinedAt;
  }

  saveSeasonData(data);

  // Update state
  setState({ seasonPoints: participant.seasonPoints });

  // Check for tier unlock
  const oldTier = getRewardTier(participant.seasonPoints - points);
  const newTier = getRewardTier(participant.seasonPoints);

  if (newTier && (!oldTier || newTier.id !== oldTier.id)) {
    showToast(`${newTier.icon} Niveau ${newTier.name} atteint !`, 'success');
  }

  return participant.seasonPoints;
}

/**
 * Get season leaderboard
 * @returns {Array} Sorted leaderboard entries
 */
export function getSeasonLeaderboard() {
  checkSeasonReset();

  const data = loadSeasonData();
  let participants = [...(data.participants || [])];

  // Add mock players if not enough participants
  if (participants.length < 15) {
    const mockPlayers = generateMockSeasonPlayers();
    participants = [...participants, ...mockPlayers].slice(0, 50);
  }

  // Sort by season points
  const sorted = participants.sort((a, b) => b.seasonPoints - a.seasonPoints);

  // Add rank
  return sorted.map((p, index) => ({
    ...p,
    rank: index + 1,
  }));
}

/**
 * Get user's season rank
 * @returns {Object} Rank info
 */
export function getUserSeasonRank() {
  const state = getState();
  const leaderboard = getSeasonLeaderboard();
  const userId = state.user?.uid || 'local_user';

  const rank = leaderboard.findIndex(p => p.id === userId) + 1;
  const user = leaderboard.find(p => p.id === userId);

  return {
    rank: rank || null,
    seasonPoints: user?.seasonPoints || state.seasonPoints || 0,
    isInTop10: rank > 0 && rank <= 10,
    isInTop3: rank > 0 && rank <= 3,
    tier: getRewardTier(user?.seasonPoints || state.seasonPoints || 0),
  };
}

/**
 * Generate mock players for demo
 * @returns {Array} Mock player entries
 */
function generateMockSeasonPlayers() {
  const mockNames = [
    { username: 'SeasonKing', avatar: '👑', level: 18 },
    { username: 'RoadMaster', avatar: '🛤️', level: 16 },
    { username: 'ThumbsUp', avatar: '👍', level: 15 },
    { username: 'WanderlustPro', avatar: '🌍', level: 14 },
    { username: 'FreeSoul', avatar: '✌️', level: 13 },
    { username: 'HitchQueen', avatar: '👸', level: 12 },
    { username: 'Nomad42', avatar: '🎒', level: 11 },
    { username: 'RoadTripper', avatar: '🚗', level: 10 },
    { username: 'Backpacker', avatar: '🧳', level: 9 },
    { username: 'Explorer99', avatar: '🧭', level: 8 },
    { username: 'Adventurer', avatar: '⛺', level: 12 },
    { username: 'TrailBlazer', avatar: '🔥', level: 11 },
    { username: 'SunChaser', avatar: '🌞', level: 9 },
    { username: 'WindRider', avatar: '💨', level: 10 },
    { username: 'MountainGoat', avatar: '🐐', level: 8 },
  ];

  return mockNames.map((player, index) => ({
    id: `mock_season_${index}`,
    ...player,
    seasonPoints: Math.floor(Math.random() * 4500) + 500,
    lastActivity: new Date().toISOString(),
  }));
}

/**
 * Render season banner HTML
 * @returns {string} HTML string
 */
export function renderSeasonBanner() {
  const season = getCurrentSeason();
  const progress = getSeasonProgress();
  const state = getState();
  const lang = state.lang || 'fr';

  const name = lang === 'fr' ? season.name : season.nameEn;
  const theme = lang === 'fr' ? season.theme : season.themeEn;
  const { days, hours, expired } = progress.timeRemaining;

  const tierName = progress.currentTier
    ? (lang === 'fr' ? progress.currentTier.name : progress.currentTier.nameEn)
    : (lang === 'fr' ? 'Aucun' : 'None');

  return `
    <div class="bg-gradient-to-r ${season.gradient} rounded-xl p-4 text-white">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="text-3xl animate-bounce-slow">${season.icon}</span>
          <div>
            <h3 class="font-bold text-lg">${lang === 'fr' ? 'Saison' : 'Season'} ${name}</h3>
            <p class="text-sm opacity-90">${escapeHTML(theme)}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm opacity-75">${lang === 'fr' ? 'Temps restant' : 'Time left'}</div>
          <div class="font-bold">${expired ? (lang === 'fr' ? 'Terminee' : 'Ended') : `${days}j ${hours}h`}</div>
        </div>
      </div>

      <div class="bg-white/20 rounded-lg p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm">${lang === 'fr' ? 'Tes points' : 'Your points'}</span>
          <span class="font-bold">${progress.seasonPoints.toLocaleString()} pts</span>
        </div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm">${lang === 'fr' ? 'Niveau actuel' : 'Current tier'}</span>
          <span class="font-medium">${progress.currentTier?.icon || '🔒'} ${tierName}</span>
        </div>
        ${progress.nextTier ? `
          <div class="mt-3">
            <div class="flex justify-between text-xs mb-1">
              <span>${lang === 'fr' ? 'Prochain niveau' : 'Next tier'}: ${lang === 'fr' ? progress.nextTier.name : progress.nextTier.nameEn}</span>
              <span>${progress.pointsToNextTier} pts</span>
            </div>
            <div class="bg-white/30 rounded-full h-2 overflow-hidden">
              <div class="bg-white h-full transition-all" style="width: ${Math.round(progress.progressToNextTier * 100)}%"></div>
            </div>
          </div>
        ` : `
          <div class="text-center text-sm mt-2 opacity-90">
            ${lang === 'fr' ? 'Niveau maximum atteint !' : 'Maximum tier reached!'}
          </div>
        `}
      </div>

      <button onclick="window.openSeasonRewards()"
        class="w-full mt-3 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-medium transition-colors">
        ${lang === 'fr' ? 'Voir les recompenses' : 'View rewards'}
      </button>
    </div>
  `;
}

/**
 * Render season rewards modal content
 * @returns {string} HTML string
 */
export function renderSeasonRewardsContent() {
  const rewards = getSeasonRewards();
  const progress = getSeasonProgress();
  const state = getState();
  const lang = state.lang || 'fr';

  return `
    <div class="space-y-4">
      ${rewards.map(tier => {
    const tierName = lang === 'fr' ? tier.name : tier.nameEn;
    const isCurrentTier = progress.currentTier?.id === tier.id;

    return `
          <div class="p-4 rounded-xl border-2 ${
  tier.isUnlocked
    ? isCurrentTier
      ? 'border-primary-500 bg-primary-500/10'
      : 'border-green-500/50 bg-green-500/10'
    : 'border-white/10 bg-dark-primary opacity-60'
}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-2xl">${tier.icon}</span>
                <div>
                  <h4 class="font-semibold ${tier.isUnlocked ? 'text-white' : 'text-slate-400'}">${tierName}</h4>
                  <span class="text-xs text-slate-400">${tier.minPoints.toLocaleString()} pts</span>
                </div>
              </div>
              ${tier.isUnlocked ? `
                ${tier.isClaimed ? `
                  <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    ✓ ${lang === 'fr' ? 'Reclame' : 'Claimed'}
                  </span>
                ` : `
                  <button onclick="window.claimSeasonReward('${tier.id}')"
                    class="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 transition-colors">
                    ${lang === 'fr' ? 'Reclamer' : 'Claim'}
                  </button>
                `}
              ` : `
                <span class="text-slate-500">${icon('lock', 'w-5 h-5')}</span>
              `}
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              ${tier.rewards.map(reward => `
                <span class="px-2 py-1 bg-white/5 rounded text-xs ${tier.isUnlocked ? 'text-slate-300' : 'text-slate-500'}">
                  ${reward.type === 'points' ? `+${reward.amount} pts` : `${getRewardIcon(reward.type)} ${reward.name}`}
                </span>
              `).join('')}
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

/**
 * Get icon for reward type
 * @param {string} type - Reward type
 * @returns {string} Emoji icon
 */
function getRewardIcon(type) {
  const icons = {
    badge: '🏆',
    frame: '🖼️',
    title: '📛',
    skin: '🎨',
    points: '💰',
  };
  return icons[type] || '🎁';
}

/**
 * Helper to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize season tracking
 */
export function initSeasons() {
  checkSeasonReset();

  // Check for reset every hour
  setInterval(() => {
    checkSeasonReset();
  }, 3600000);
}

// Global window handlers
if (typeof window !== 'undefined') {
  window.openSeasonRewards = () => {
    setState({ showSeasonRewards: true });
  };
  window.closeSeasonRewards = () => {
    setState({ showSeasonRewards: false });
  };
  window.claimSeasonReward = claimSeasonReward;
}

export default {
  SEASON_DEFINITIONS,
  SEASON_REWARD_TIERS,
  getSeasonIdFromDate,
  getSeasonIdentifier,
  getCurrentSeason,
  getSeasonStartDate,
  getSeasonEndDate,
  getSeasonTimeRemaining,
  formatSeasonTimeRemaining,
  checkSeasonReset,
  getSeasonProgress,
  getRewardTier,
  getNextRewardTier,
  getSeasonRewards,
  claimSeasonReward,
  addSeasonPoints,
  getSeasonLeaderboard,
  getUserSeasonRank,
  loadSeasonHistory,
  loadClaimedRewards,
  renderSeasonBanner,
  renderSeasonRewardsContent,
  initSeasons,
};
