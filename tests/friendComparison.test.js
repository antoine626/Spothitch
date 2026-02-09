/**
 * Friend Comparison Service Tests (#173)
 * Tests for friend stats comparison and leaderboard functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock state module
const mockState = {
  user: { uid: 'user123' },
  username: 'TestUser',
  avatar: '🤙',
  level: 10,
  points: 1500,
  checkins: 25,
  spotsCreated: 8,
  reviewsGiven: 15,
  streak: 5,
  badges: ['first_checkin', 'explorer', 'reviewer'],
  countriesVisited: 4,
  visitedCountries: ['FR', 'ES', 'DE', 'BE'],
  totalDistance: 2500000, // in meters
  totalDistanceKm: 2500,
  seasonPoints: 300,
  friends: [
    {
      id: 'friend1',
      username: 'Alice',
      avatar: '👩',
      level: 12,
      points: 2000,
      checkins: 30,
      spotsCreated: 5,
      reviewsGiven: 20,
      streak: 7,
      badgesCount: 5,
      countriesVisited: 6,
      totalDistanceKm: 3000,
      seasonPoints: 400,
    },
    {
      id: 'friend2',
      username: 'Bob',
      avatar: '👨',
      level: 8,
      points: 1000,
      checkins: 15,
      spotsCreated: 10,
      reviewsGiven: 8,
      streak: 3,
      badgesCount: 2,
      countriesVisited: 2,
      totalDistanceKm: 1500,
      seasonPoints: 200,
    },
  ],
};

vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: (key, params = {}) => {
    const translations = {
      anonymousUser: 'Anonymous',
      friendNotFound: 'Friend not found',
      comparisonYouWin: 'You win!',
      comparisonFriendWins: 'They win!',
      comparisonTie: "It's a tie!",
      comparisonScore: 'Score',
      you: 'You',
      challengeFriend: 'Challenge',
      noFriendsYet: 'No friends yet',
      addFriendsToCompare: 'Add friends to compare',
      findFriends: 'Find friends',
      friendsLeaderboard: 'Friends leaderboard',
      leaderboardFirst: "You're 1st!",
      leaderboardPosition: `${params.position} of ${params.total}`,
      globalLeaderboard: 'Global leaderboard',
      viewMore: 'View more',
      compareWith: 'Compare with',
      leaderboardTop10: 'Top 10%',
      leaderboardTop25: 'Top 25%',
      leaderboardTop50: 'Top 50%',
      leaderboardOther: 'Challenger',
      stat_level: 'Level',
      stat_points: 'Points',
      stat_checkins: 'Check-ins',
      stat_spotsCreated: 'Spots created',
      stat_reviewsGiven: 'Reviews given',
      stat_streak: 'Streak',
      stat_badges: 'Badges',
      stat_countriesVisited: 'Countries visited',
      stat_totalDistance: 'Distance',
      shareError: 'Share error',
      level: 'Level',
      points: 'points',
      share: 'Share',
    };
    return translations[key] || key;
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Import after mocks
import {
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
} from '../src/services/friendComparison.js';

describe('Friend Comparison Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('COMPARISON_STATS', () => {
    it('should have all required stats', () => {
      expect(COMPARISON_STATS).toBeInstanceOf(Array);
      expect(COMPARISON_STATS.length).toBeGreaterThanOrEqual(9);
    });

    it('should have required properties for each stat', () => {
      for (const stat of COMPARISON_STATS) {
        expect(stat).toHaveProperty('id');
        expect(stat).toHaveProperty('key');
        expect(stat).toHaveProperty('icon');
        expect(stat).toHaveProperty('direction');
      }
    });

    it('should include key stats like level, points, checkins', () => {
      const statIds = COMPARISON_STATS.map(s => s.id);
      expect(statIds).toContain('level');
      expect(statIds).toContain('points');
      expect(statIds).toContain('checkins');
      expect(statIds).toContain('spotsCreated');
      expect(statIds).toContain('badges');
    });
  });

  describe('getUserStats', () => {
    it('should return current user stats when called with "me"', () => {
      const stats = getUserStats('me');

      expect(stats).toBeDefined();
      expect(stats.username).toBe('TestUser');
      expect(stats.level).toBe(10);
      expect(stats.points).toBe(1500);
      expect(stats.checkins).toBe(25);
    });

    it('should return current user stats when called with user id', () => {
      const stats = getUserStats('user123');

      expect(stats).toBeDefined();
      expect(stats.username).toBe('TestUser');
    });

    it('should return current user stats when called with no id', () => {
      const stats = getUserStats();

      expect(stats).toBeDefined();
      expect(stats.username).toBe('TestUser');
    });

    it('should return friend stats when called with friend id', () => {
      const stats = getUserStats('friend1');

      expect(stats).toBeDefined();
      expect(stats.username).toBe('Alice');
      expect(stats.level).toBe(12);
      expect(stats.points).toBe(2000);
    });

    it('should return null for non-existent friend', () => {
      const stats = getUserStats('nonexistent');

      expect(stats).toBeNull();
    });

    it('should include badgesCount from badges array', () => {
      const stats = getUserStats('me');

      expect(stats.badgesCount).toBe(3);
    });

    it('should calculate countriesVisited from visitedCountries array', () => {
      const stats = getUserStats('me');

      expect(stats.countriesVisited).toBe(4);
    });
  });

  describe('compareWithFriend', () => {
    it('should return comparison result with friend', () => {
      const result = compareWithFriend('friend1');

      expect(result.success).toBe(true);
      expect(result.myStats).toBeDefined();
      expect(result.friendStats).toBeDefined();
      expect(result.comparisons).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
    });

    it('should return error for non-existent friend', () => {
      const result = compareWithFriend('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Friend not found');
    });

    it('should correctly identify winner for each stat', () => {
      const result = compareWithFriend('friend1');

      const levelComp = result.comparisons.find(c => c.statId === 'level');
      expect(levelComp.winner).toBe('friend'); // Alice has level 12 vs 10

      const spotsComp = result.comparisons.find(c => c.statId === 'spotsCreated');
      expect(spotsComp.winner).toBe('me'); // User has 8 vs 5
    });

    it('should calculate summary correctly', () => {
      const result = compareWithFriend('friend1');

      expect(result.summary).toHaveProperty('myWins');
      expect(result.summary).toHaveProperty('friendWins');
      expect(result.summary).toHaveProperty('ties');
      expect(result.summary).toHaveProperty('overallWinner');
    });

    it('should determine overall winner correctly', () => {
      const result = compareWithFriend('friend2');

      // User should win against friend2 (Bob)
      expect(result.summary.overallWinner).toBe('me');
    });

    it('should include diff for each comparison', () => {
      const result = compareWithFriend('friend1');

      for (const comp of result.comparisons) {
        expect(comp).toHaveProperty('diff');
        expect(comp.diff).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getComparisonStats', () => {
    it('should return extended comparison stats', () => {
      const result = getComparisonStats('friend1');

      expect(result.success).toBe(true);
      expect(result.betterStats).toBeInstanceOf(Array);
      expect(result.worseStats).toBeInstanceOf(Array);
      expect(result.tiedStats).toBeInstanceOf(Array);
    });

    it('should include weighted score', () => {
      const result = getComparisonStats('friend1');

      expect(result.weightedScore).toBeDefined();
      expect(result.weightedScore).toHaveProperty('myScore');
      expect(result.weightedScore).toHaveProperty('friendScore');
      expect(result.weightedScore).toHaveProperty('myPercent');
      expect(result.weightedScore).toHaveProperty('friendPercent');
    });

    it('should identify biggest lead', () => {
      const result = getComparisonStats('friend2');

      expect(result.biggestLead).toBeDefined();
      expect(result.biggestLead.winner).toBe('me');
    });

    it('should identify biggest gap', () => {
      const result = getComparisonStats('friend1');

      expect(result.biggestGap).toBeDefined();
      expect(result.biggestGap.winner).toBe('friend');
    });

    it('should return error for non-existent friend', () => {
      const result = getComparisonStats('nonexistent');

      expect(result.success).toBe(false);
    });
  });

  describe('getRanking', () => {
    it('should return ranking among friends', () => {
      const ranking = getRanking();

      expect(ranking).toHaveProperty('position');
      expect(ranking).toHaveProperty('total');
      expect(ranking).toHaveProperty('rankings');
      expect(ranking).toHaveProperty('category');
    });

    it('should include all friends in rankings', () => {
      const ranking = getRanking();

      // User + 2 friends = 3 total
      expect(ranking.total).toBe(3);
      expect(ranking.rankings.length).toBe(3);
    });

    it('should sort by points descending', () => {
      const ranking = getRanking();

      // Alice (2000) > User (1500) > Bob (1000)
      expect(ranking.rankings[0].username).toBe('Alice');
      expect(ranking.rankings[1].isMe).toBe(true);
      expect(ranking.rankings[2].username).toBe('Bob');
    });

    it('should assign correct ranks', () => {
      const ranking = getRanking();

      expect(ranking.rankings[0].rank).toBe(1);
      expect(ranking.rankings[1].rank).toBe(2);
      expect(ranking.rankings[2].rank).toBe(3);
    });

    it('should include isFirst and isLast flags', () => {
      const ranking = getRanking();

      expect(ranking).toHaveProperty('isFirst');
      expect(ranking).toHaveProperty('isLast');
      expect(ranking.isFirst).toBe(false); // Alice is first
      expect(ranking.isLast).toBe(false); // Bob is last
    });

    it('should include nearby users', () => {
      const ranking = getRanking();

      expect(ranking.nearbyUsers).toBeInstanceOf(Array);
      expect(ranking.nearbyUsers.length).toBeGreaterThan(0);
    });
  });

  describe('getLeaderboardPosition', () => {
    it('should return leaderboard position info', () => {
      const position = getLeaderboardPosition();

      expect(position).toHaveProperty('position');
      expect(position).toHaveProperty('total');
      expect(position).toHaveProperty('percentile');
      expect(position).toHaveProperty('tier');
    });

    it('should estimate position based on points', () => {
      const position = getLeaderboardPosition();

      expect(position.position).toBeGreaterThanOrEqual(1);
      expect(position.total).toBeGreaterThan(0);
    });

    it('should calculate percentile', () => {
      const position = getLeaderboardPosition();

      expect(position.percentile).toBeGreaterThanOrEqual(0);
      expect(position.percentile).toBeLessThanOrEqual(100);
    });

    it('should assign tier based on percentile', () => {
      const position = getLeaderboardPosition();

      expect(['top10', 'top25', 'top50', 'other']).toContain(position.tier);
    });

    it('should include tier label', () => {
      const position = getLeaderboardPosition();

      expect(position.tierLabel).toBeDefined();
    });
  });

  describe('getBetterStats', () => {
    it('should return stats where user is better', () => {
      const better = getBetterStats('friend2');

      expect(better).toBeInstanceOf(Array);
      expect(better.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent friend', () => {
      const better = getBetterStats('nonexistent');

      expect(better).toEqual([]);
    });

    it('should include advantage info', () => {
      const better = getBetterStats('friend2');

      for (const stat of better) {
        expect(stat).toHaveProperty('advantage');
        expect(stat).toHaveProperty('advantagePercent');
      }
    });

    it('should only include stats where winner is "me"', () => {
      const better = getBetterStats('friend1');

      for (const stat of better) {
        expect(stat.winner).toBe('me');
      }
    });
  });

  describe('getWorseStats', () => {
    it('should return stats where friend is better', () => {
      const worse = getWorseStats('friend1');

      expect(worse).toBeInstanceOf(Array);
      expect(worse.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent friend', () => {
      const worse = getWorseStats('nonexistent');

      expect(worse).toEqual([]);
    });

    it('should include gap info', () => {
      const worse = getWorseStats('friend1');

      for (const stat of worse) {
        expect(stat).toHaveProperty('gap');
        expect(stat).toHaveProperty('gapPercent');
      }
    });

    it('should only include stats where winner is "friend"', () => {
      const worse = getWorseStats('friend1');

      for (const stat of worse) {
        expect(stat.winner).toBe('friend');
      }
    });
  });

  describe('renderComparisonCard', () => {
    it('should render HTML for friend comparison', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('comparison-card');
      expect(html).toContain('Alice');
    });

    it('should include avatars', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('🤙'); // User avatar
      expect(html).toContain('👩'); // Alice avatar
    });

    it('should include stats comparison rows', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('comparison-stat');
    });

    it('should include action buttons', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('challengeFriend');
      expect(html).toContain('share');
    });

    it('should render error message for non-existent friend', () => {
      const html = renderComparisonCard('nonexistent');

      expect(html).toContain('Friend not found');
    });

    it('should include data-friend-id attribute', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('data-friend-id="friend1"');
    });

    it('should include score bar', () => {
      const html = renderComparisonCard('friend1');

      expect(html).toContain('Score');
    });
  });

  describe('renderLeaderboard', () => {
    it('should render HTML for friends leaderboard', () => {
      const html = renderLeaderboard();

      expect(html).toContain('leaderboard');
      expect(html).toContain('Friends leaderboard');
    });

    it('should include all friends in ranking', () => {
      const html = renderLeaderboard();

      expect(html).toContain('Alice');
      expect(html).toContain('Bob');
    });

    it('should include medal emojis for top 3', () => {
      const html = renderLeaderboard();

      expect(html).toContain('🥇');
      expect(html).toContain('🥈');
      expect(html).toContain('🥉');
    });

    it('should highlight current user', () => {
      const html = renderLeaderboard();

      // Current user row has special styling with primary colors
      expect(html).toContain('bg-primary-500/20');
      expect(html).toContain('border-primary-500');
    });

    it('should include compare buttons for friends', () => {
      const html = renderLeaderboard();

      expect(html).toContain('openFriendComparison');
    });

    it('should include global leaderboard link', () => {
      const html = renderLeaderboard();

      expect(html).toContain('Global leaderboard');
      expect(html).toContain('openGlobalLeaderboard');
    });

    it('should show points for each user', () => {
      const html = renderLeaderboard();

      expect(html).toContain('2,000'); // Alice's points
      expect(html).toContain('1,500'); // User's points
      expect(html).toContain('1,000'); // Bob's points
    });
  });

  describe('getComparisonChartData', () => {
    it('should return data for charts', () => {
      const data = getComparisonChartData('friend1');

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should include stat label, my value, and friend value', () => {
      const data = getComparisonChartData('friend1');

      for (const item of data) {
        expect(item).toHaveProperty('stat');
        expect(item).toHaveProperty('me');
        expect(item).toHaveProperty('friend');
        expect(item).toHaveProperty('maxValue');
      }
    });

    it('should return empty array for non-existent friend', () => {
      const data = getComparisonChartData('nonexistent');

      expect(data).toEqual([]);
    });
  });

  describe('shareComparison', () => {
    it('should be a function', () => {
      expect(typeof shareComparison).toBe('function');
    });

    it('should be available as global function', () => {
      expect(typeof window.shareComparison).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle friend with zero stats', () => {
      // Temporarily modify mock state
      const originalFriends = mockState.friends;
      mockState.friends = [
        {
          id: 'zeroFriend',
          username: 'Zero',
          avatar: '👻',
          level: 1,
          points: 0,
          checkins: 0,
          spotsCreated: 0,
          reviewsGiven: 0,
          streak: 0,
          badgesCount: 0,
          countriesVisited: 0,
          totalDistanceKm: 0,
          seasonPoints: 0,
        },
      ];

      const result = compareWithFriend('zeroFriend');

      expect(result.success).toBe(true);
      expect(result.summary.overallWinner).toBe('me');

      // Restore
      mockState.friends = originalFriends;
    });

    it('should handle tie in all stats', () => {
      const originalFriends = mockState.friends;
      mockState.friends = [
        {
          id: 'twinFriend',
          username: 'Twin',
          avatar: '👯',
          level: 10,
          points: 1500,
          checkins: 25,
          spotsCreated: 8,
          reviewsGiven: 15,
          streak: 5,
          badgesCount: 3,
          countriesVisited: 4,
          totalDistanceKm: 2500,
          seasonPoints: 300,
        },
      ];

      const result = compareWithFriend('twinFriend');

      expect(result.success).toBe(true);
      expect(result.summary.ties).toBe(result.comparisons.length);
      expect(result.summary.overallWinner).toBe('tie');

      mockState.friends = originalFriends;
    });

    it('should handle odUserId in friend object', () => {
      const originalFriends = mockState.friends;
      mockState.friends = [
        {
          odUserId: 'odUser123',
          username: 'ODUser',
          avatar: '🆔',
          level: 5,
          points: 500,
        },
      ];

      const stats = getUserStats('odUser123');

      expect(stats).toBeDefined();
      expect(stats.username).toBe('ODUser');

      mockState.friends = originalFriends;
    });
  });

  describe('Ranking with no friends', () => {
    it('should handle empty friends list', () => {
      const originalFriends = mockState.friends;
      mockState.friends = [];

      const ranking = getRanking();

      expect(ranking.position).toBe(1);
      expect(ranking.total).toBe(1);
      expect(ranking.rankings.length).toBe(1);
      expect(ranking.rankings[0].isMe).toBe(true);

      mockState.friends = originalFriends;
    });
  });

  describe('Leaderboard with no friends', () => {
    it('should render empty state message', () => {
      const originalFriends = mockState.friends;
      mockState.friends = [];

      const html = renderLeaderboard();

      expect(html).toContain('No friends yet');
      expect(html).toContain('Find friends');

      mockState.friends = originalFriends;
    });
  });
});
