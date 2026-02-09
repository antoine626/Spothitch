/**
 * Friend Comparison Service (#173)
 * Service pour comparer les stats entre amis
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js';
import { showToast } from './notifications.js';

/**
 * Stats types for comparison
 */
export const COMPARISON_STATS = [
  { id: 'level', key: 'level', icon: '⭐', direction: 'higher' },
  { id: 'points', key: 'points', icon: '💎', direction: 'higher' },
  { id: 'checkins', key: 'checkins', icon: '📍', direction: 'higher' },
  { id: 'spotsCreated', key: 'spotsCreated', icon: '🗺️', direction: 'higher' },
  { id: 'reviewsGiven', key: 'reviewsGiven', icon: '✍️', direction: 'higher' },
  { id: 'streak', key: 'streak', icon: '🔥', direction: 'higher' },
  { id: 'badges', key: 'badgesCount', icon: '🏆', direction: 'higher' },
  { id: 'countriesVisited', key: 'countriesVisited', icon: '🌍', direction: 'higher' },
  { id: 'totalDistance', key: 'totalDistanceKm', icon: '🚗', direction: 'higher' },
];

/**
 * Get user stats for comparison
 * @param {string} userId - User ID (or 'me' for current user)
 * @returns {Object} User stats object
 */
export function getUserStats(userId) {
  const state = getState();

  // Current user stats
  if (!userId || userId === 'me' || userId === state.user?.uid) {
    return {
      id: state.user?.uid || 'me',
      username: state.username || t('anonymousUser'),
      avatar: state.avatar || '🤙',
      level: state.level || 1,
      points: state.points || 0,
      checkins: state.checkins || 0,
      spotsCreated: state.spotsCreated || 0,
      reviewsGiven: state.reviewsGiven || 0,
      streak: state.streak || 0,
      badgesCount: (state.badges || []).length,
      countriesVisited: state.countriesVisited || (state.visitedCountries?.length || 0),
      totalDistanceKm: state.totalDistanceKm || Math.round((state.totalDistance || 0) / 1000),
      seasonPoints: state.seasonPoints || 0,
    };
  }

  // Get friend stats from state
  const friends = state.friends || [];
  const friend = friends.find(f => f.id === userId || f.odUserId === userId);

  if (!friend) {
    console.warn(`[FriendComparison] Friend not found: ${userId}`);
    return null;
  }

  return {
    id: friend.id || friend.odUserId,
    username: friend.username || friend.displayName || t('anonymousUser'),
    avatar: friend.avatar || '🤙',
    level: friend.level || 1,
    points: friend.points || 0,
    checkins: friend.checkins || 0,
    spotsCreated: friend.spotsCreated || 0,
    reviewsGiven: friend.reviewsGiven || 0,
    streak: friend.streak || 0,
    badgesCount: friend.badgesCount || (friend.badges?.length || 0),
    countriesVisited: friend.countriesVisited || (friend.visitedCountries?.length || 0),
    totalDistanceKm: friend.totalDistanceKm || Math.round((friend.totalDistance || 0) / 1000),
    seasonPoints: friend.seasonPoints || 0,
  };
}

/**
 * Compare stats with a friend
 * @param {string} friendId - Friend's user ID
 * @returns {Object} Comparison result with winner per stat
 */
export function compareWithFriend(friendId) {
  const myStats = getUserStats('me');
  const friendStats = getUserStats(friendId);

  if (!friendStats) {
    return {
      success: false,
      error: t('friendNotFound'),
      myStats,
      friendStats: null,
      comparisons: [],
    };
  }

  const comparisons = [];
  let myWins = 0;
  let friendWins = 0;
  let ties = 0;

  for (const stat of COMPARISON_STATS) {
    const myValue = myStats[stat.key] || 0;
    const friendValue = friendStats[stat.key] || 0;
    const diff = myValue - friendValue;

    let winner = 'tie';
    if (diff > 0) {
      winner = 'me';
      myWins++;
    } else if (diff < 0) {
      winner = 'friend';
      friendWins++;
    } else {
      ties++;
    }

    comparisons.push({
      statId: stat.id,
      statKey: stat.key,
      icon: stat.icon,
      myValue,
      friendValue,
      diff: Math.abs(diff),
      winner,
      percentage: friendValue > 0 ? Math.round((myValue / friendValue) * 100) : myValue > 0 ? 100 : 0,
    });
  }

  const overallWinner = myWins > friendWins ? 'me' : friendWins > myWins ? 'friend' : 'tie';

  return {
    success: true,
    myStats,
    friendStats,
    comparisons,
    summary: {
      myWins,
      friendWins,
      ties,
      overallWinner,
    },
  };
}

/**
 * Get detailed comparison stats with a friend
 * @param {string} friendId - Friend's user ID
 * @returns {Object} Detailed comparison stats
 */
export function getComparisonStats(friendId) {
  const comparison = compareWithFriend(friendId);

  if (!comparison.success) {
    return comparison;
  }

  // Add detailed analysis
  const betterStats = comparison.comparisons.filter(c => c.winner === 'me');
  const worseStats = comparison.comparisons.filter(c => c.winner === 'friend');
  const tiedStats = comparison.comparisons.filter(c => c.winner === 'tie');

  // Calculate overall score (weighted)
  const weights = {
    level: 3,
    points: 2,
    checkins: 2,
    spotsCreated: 3,
    reviewsGiven: 1,
    streak: 2,
    badges: 2,
    countriesVisited: 3,
    totalDistance: 2,
  };

  let myWeightedScore = 0;
  let friendWeightedScore = 0;

  for (const comp of comparison.comparisons) {
    const weight = weights[comp.statId] || 1;
    if (comp.winner === 'me') {
      myWeightedScore += weight;
    } else if (comp.winner === 'friend') {
      friendWeightedScore += weight;
    }
  }

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const myScorePercent = Math.round((myWeightedScore / totalWeight) * 100);
  const friendScorePercent = Math.round((friendWeightedScore / totalWeight) * 100);

  return {
    ...comparison,
    betterStats,
    worseStats,
    tiedStats,
    weightedScore: {
      myScore: myWeightedScore,
      friendScore: friendWeightedScore,
      myPercent: myScorePercent,
      friendPercent: friendScorePercent,
    },
    biggestLead: betterStats.length > 0
      ? betterStats.reduce((max, s) => s.diff > max.diff ? s : max, betterStats[0])
      : null,
    biggestGap: worseStats.length > 0
      ? worseStats.reduce((max, s) => s.diff > max.diff ? s : max, worseStats[0])
      : null,
  };
}

/**
 * Get ranking among friends
 * @returns {Object} Ranking information
 */
export function getRanking() {
  const state = getState();
  const myStats = getUserStats('me');
  const friends = state.friends || [];

  if (friends.length === 0) {
    return {
      position: 1,
      total: 1,
      rankings: [{ ...myStats, rank: 1, isMe: true }],
      category: 'level',
    };
  }

  // Get all users (me + friends) with their stats
  const allUsers = [
    { ...myStats, isMe: true },
    ...friends.map(f => ({
      ...getUserStats(f.id || f.odUserId),
      isMe: false,
    })).filter(f => f !== null),
  ];

  // Sort by points (default ranking)
  allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));

  // Assign ranks
  allUsers.forEach((user, index) => {
    user.rank = index + 1;
  });

  const myRank = allUsers.find(u => u.isMe);

  return {
    position: myRank?.rank || 1,
    total: allUsers.length,
    rankings: allUsers,
    category: 'points',
    isFirst: myRank?.rank === 1,
    isLast: myRank?.rank === allUsers.length,
    nearbyUsers: allUsers.slice(
      Math.max(0, (myRank?.rank || 1) - 2),
      Math.min(allUsers.length, (myRank?.rank || 1) + 1)
    ),
  };
}

/**
 * Get position in global leaderboard
 * @returns {Object} Leaderboard position
 */
export function getLeaderboardPosition() {
  const state = getState();
  const myStats = getUserStats('me');

  // Simulated global leaderboard (in real app, this would come from backend)
  // For now, estimate based on points
  const estimatedTotalUsers = 1500; // From app stats
  const estimatedPosition = Math.max(
    1,
    Math.round(estimatedTotalUsers * (1 - (myStats.points / 10000)))
  );

  // Get percentile
  const percentile = Math.round(((estimatedTotalUsers - estimatedPosition) / estimatedTotalUsers) * 100);

  return {
    position: estimatedPosition,
    total: estimatedTotalUsers,
    percentile,
    topPercent: Math.max(1, 100 - percentile),
    tier: percentile >= 90 ? 'top10' : percentile >= 75 ? 'top25' : percentile >= 50 ? 'top50' : 'other',
    tierLabel: percentile >= 90 ? t('leaderboardTop10') : percentile >= 75 ? t('leaderboardTop25') : percentile >= 50 ? t('leaderboardTop50') : t('leaderboardOther'),
    points: myStats.points,
    level: myStats.level,
  };
}

/**
 * Get list of stats where user is better than friend
 * @param {string} friendId - Friend's user ID
 * @returns {Array} List of better stats
 */
export function getBetterStats(friendId) {
  const comparison = compareWithFriend(friendId);

  if (!comparison.success) {
    return [];
  }

  return comparison.comparisons
    .filter(c => c.winner === 'me')
    .map(c => ({
      ...c,
      label: t(`stat_${c.statId}`),
      advantage: c.diff,
      advantagePercent: c.friendValue > 0
        ? Math.round(((c.myValue - c.friendValue) / c.friendValue) * 100)
        : 100,
    }));
}

/**
 * Get list of stats where friend is better
 * @param {string} friendId - Friend's user ID
 * @returns {Array} List of worse stats
 */
export function getWorseStats(friendId) {
  const comparison = compareWithFriend(friendId);

  if (!comparison.success) {
    return [];
  }

  return comparison.comparisons
    .filter(c => c.winner === 'friend')
    .map(c => ({
      ...c,
      label: t(`stat_${c.statId}`),
      gap: c.diff,
      gapPercent: c.myValue > 0
        ? Math.round(((c.friendValue - c.myValue) / c.myValue) * 100)
        : 100,
    }));
}

/**
 * Render comparison card HTML
 * @param {string} friendId - Friend's user ID
 * @returns {string} HTML string for comparison card
 */
export function renderComparisonCard(friendId) {
  const comparison = getComparisonStats(friendId);

  if (!comparison.success) {
    return `
      <div class="comparison-card bg-dark-secondary rounded-xl p-4 text-center">
        <p class="text-gray-400">${comparison.error || t('friendNotFound')}</p>
      </div>
    `;
  }

  const { myStats, friendStats, summary, weightedScore } = comparison;

  // Determine winner emoji
  const winnerEmoji = summary.overallWinner === 'me' ? '🏆' : summary.overallWinner === 'friend' ? '😅' : '🤝';
  const resultText = summary.overallWinner === 'me'
    ? t('comparisonYouWin')
    : summary.overallWinner === 'friend'
      ? t('comparisonFriendWins')
      : t('comparisonTie');

  // Build stats rows
  const statsHtml = comparison.comparisons.map(comp => {
    const myBarWidth = comp.myValue > 0 || comp.friendValue > 0
      ? Math.round((comp.myValue / Math.max(comp.myValue, comp.friendValue, 1)) * 100)
      : 50;
    const friendBarWidth = comp.myValue > 0 || comp.friendValue > 0
      ? Math.round((comp.friendValue / Math.max(comp.myValue, comp.friendValue, 1)) * 100)
      : 50;

    const myClass = comp.winner === 'me' ? 'text-green-400 font-bold' : 'text-gray-400';
    const friendClass = comp.winner === 'friend' ? 'text-green-400 font-bold' : 'text-gray-400';

    return `
      <div class="comparison-stat flex items-center gap-2 py-2 border-b border-dark-tertiary last:border-0">
        <span class="text-lg w-8">${comp.icon}</span>
        <div class="flex-1">
          <div class="flex justify-between text-sm mb-1">
            <span class="${myClass}">${comp.myValue}</span>
            <span class="text-gray-500 text-xs">${t(`stat_${comp.statId}`)}</span>
            <span class="${friendClass}">${comp.friendValue}</span>
          </div>
          <div class="flex gap-1 h-2">
            <div class="flex-1 bg-dark-tertiary rounded-full overflow-hidden">
              <div class="h-full ${comp.winner === 'me' ? 'bg-green-500' : 'bg-gray-500'} rounded-full transition-all" style="width: ${myBarWidth}%"></div>
            </div>
            <div class="flex-1 bg-dark-tertiary rounded-full overflow-hidden">
              <div class="h-full ${comp.winner === 'friend' ? 'bg-green-500' : 'bg-gray-500'} rounded-full transition-all ml-auto" style="width: ${friendBarWidth}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="comparison-card bg-dark-secondary rounded-xl p-4" data-friend-id="${friendId}">
      <!-- Header with avatars -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex flex-col items-center">
          <span class="text-3xl">${myStats.avatar}</span>
          <span class="text-sm text-white mt-1">${t('you')}</span>
          <span class="text-xs text-gray-400">${t('level')} ${myStats.level}</span>
        </div>

        <div class="flex flex-col items-center">
          <span class="text-2xl">${winnerEmoji}</span>
          <span class="text-xs text-primary-400 font-medium">${resultText}</span>
          <span class="text-xs text-gray-500">${summary.myWins}-${summary.ties}-${summary.friendWins}</span>
        </div>

        <div class="flex flex-col items-center">
          <span class="text-3xl">${friendStats.avatar}</span>
          <span class="text-sm text-white mt-1">${friendStats.username}</span>
          <span class="text-xs text-gray-400">${t('level')} ${friendStats.level}</span>
        </div>
      </div>

      <!-- Score bar -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>${weightedScore.myPercent}%</span>
          <span>${t('comparisonScore')}</span>
          <span>${weightedScore.friendPercent}%</span>
        </div>
        <div class="flex h-3 bg-dark-tertiary rounded-full overflow-hidden">
          <div class="bg-primary-500 transition-all" style="width: ${weightedScore.myPercent}%"></div>
          <div class="bg-gray-500 transition-all" style="width: ${weightedScore.friendPercent}%"></div>
        </div>
      </div>

      <!-- Stats comparison -->
      <div class="comparison-stats">
        ${statsHtml}
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 mt-4">
        <button
          onclick="window.challengeFriend && window.challengeFriend('${friendId}')"
          class="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          ${t('challengeFriend')}
        </button>
        <button
          onclick="window.shareComparison && window.shareComparison('${friendId}')"
          class="bg-dark-tertiary hover:bg-dark-hover text-white py-2 px-4 rounded-lg text-sm transition-colors"
        >
          ${t('share')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render friends leaderboard HTML
 * @param {Array} friends - Optional array of friends (uses state if not provided)
 * @returns {string} HTML string for leaderboard
 */
export function renderLeaderboard(friends = null) {
  const ranking = getRanking();

  if (ranking.total <= 1) {
    return `
      <div class="leaderboard bg-dark-secondary rounded-xl p-4 text-center">
        <span class="text-4xl mb-2 block">👥</span>
        <p class="text-gray-400">${t('noFriendsYet')}</p>
        <p class="text-sm text-gray-500 mt-1">${t('addFriendsToCompare')}</p>
        <button
          onclick="window.openFriendSearch && window.openFriendSearch()"
          class="mt-4 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          ${t('findFriends')}
        </button>
      </div>
    `;
  }

  // Build leaderboard rows
  const rankingsHtml = ranking.rankings.slice(0, 10).map((user, index) => {
    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
    const isMe = user.isMe;
    const rowClass = isMe ? 'bg-primary-500/20 border-primary-500' : 'bg-dark-tertiary';

    return `
      <div class="leaderboard-row flex items-center gap-3 p-3 rounded-lg ${rowClass} ${isMe ? 'border' : ''}">
        <span class="w-8 text-center ${index < 3 ? 'text-xl' : 'text-sm text-gray-400'}">${rankEmoji}</span>
        <span class="text-2xl">${user.avatar}</span>
        <div class="flex-1 min-w-0">
          <p class="text-white font-medium truncate">${isMe ? t('you') : user.username}</p>
          <p class="text-xs text-gray-400">${t('level')} ${user.level}</p>
        </div>
        <div class="text-right">
          <p class="text-white font-bold">${user.points?.toLocaleString() || 0}</p>
          <p class="text-xs text-gray-400">${t('points')}</p>
        </div>
        ${!isMe ? `
          <button
            onclick="window.openFriendComparison && window.openFriendComparison('${user.id}')"
            class="ml-2 bg-dark-hover hover:bg-dark-primary text-white p-2 rounded-lg transition-colors"
            aria-label="${t('compareWith')} ${user.username}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  // My position summary
  const positionText = ranking.position === 1
    ? t('leaderboardFirst')
    : t('leaderboardPosition', { position: ranking.position, total: ranking.total });

  return `
    <div class="leaderboard bg-dark-secondary rounded-xl p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>🏅</span>
          ${t('friendsLeaderboard')}
        </h3>
        <span class="text-sm text-primary-400">${positionText}</span>
      </div>

      <!-- Rankings list -->
      <div class="space-y-2">
        ${rankingsHtml}
      </div>

      <!-- Global position -->
      <div class="mt-4 pt-4 border-t border-dark-tertiary">
        <button
          onclick="window.openGlobalLeaderboard && window.openGlobalLeaderboard()"
          class="w-full flex items-center justify-between p-3 bg-dark-tertiary hover:bg-dark-hover rounded-lg transition-colors"
        >
          <span class="text-gray-400">${t('globalLeaderboard')}</span>
          <span class="text-primary-400 flex items-center gap-1">
            ${t('viewMore')}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Get stats comparison as array for charts
 * @param {string} friendId - Friend's user ID
 * @returns {Array} Stats data for radar chart
 */
export function getComparisonChartData(friendId) {
  const comparison = compareWithFriend(friendId);

  if (!comparison.success) {
    return [];
  }

  return comparison.comparisons.map(comp => ({
    stat: t(`stat_${comp.statId}`),
    me: comp.myValue,
    friend: comp.friendValue,
    maxValue: Math.max(comp.myValue, comp.friendValue, 1),
  }));
}

/**
 * Share comparison results
 * @param {string} friendId - Friend's user ID
 */
export function shareComparison(friendId) {
  const comparison = compareWithFriend(friendId);

  if (!comparison.success) {
    showToast(t('shareError'), 'error');
    return;
  }

  const { myStats, friendStats, summary } = comparison;
  const resultText = summary.overallWinner === 'me'
    ? `J'ai battu ${friendStats.username} sur SpotHitch! 🏆`
    : summary.overallWinner === 'friend'
      ? `${friendStats.username} m'a battu sur SpotHitch! Je vais me rattraper! 💪`
      : `Match nul avec ${friendStats.username} sur SpotHitch! 🤝`;

  const shareText = `${resultText}\n${summary.myWins} victoires - ${summary.ties} egalites - ${summary.friendWins} defaites\n\n#SpotHitch #Autostop`;

  if (navigator.share) {
    navigator.share({
      title: 'Comparaison SpotHitch',
      text: shareText,
      url: 'https://spothitch.com',
    }).then(() => {
      showToast(t('shareSuccess'), 'success');
    }).catch(() => {
      // User cancelled or error
    });
  } else {
    // Fallback to clipboard
    navigator.clipboard?.writeText(shareText).then(() => {
      showToast(t('linkCopied'), 'success');
    });
  }
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
  window.shareComparison = shareComparison;
}

export default {
  COMPARISON_STATS,
  getUserStats,
  compareWithFriend,
  getComparisonStats,
  getRanking,
  getLeaderboardPosition,
  getBetterStats,
  getWorseStats,
  renderComparisonCard,
  renderLeaderboard,
  getComparisonChartData,
  shareComparison,
};
