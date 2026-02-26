/**
 * VIP Level Definitions
 * Progression system for users
 */

// Base paths for images (use import.meta.env.BASE_URL for correct path resolution)
const BASE = import.meta.env.BASE_URL || '/';
const VIP_IMG_PATH = `${BASE}images/vip`;
const LEAGUE_IMG_PATH = `${BASE}images/leagues`;

export const vipLevels = [
  {
    id: 'novice',
    name: 'Novice',
    nameEn: 'Novice',
    icon: '🌱',
    image: `${VIP_IMG_PATH}/novice.webp`,
    color: '#10b981', // green
    minPoints: 0,
    maxPoints: 499,
    benefits: [
      'Accès aux spots de base',
      'Check-ins illimités',
      'Chat communautaire',
    ],
    benefitsEn: [
      'Access to basic spots',
      'Unlimited check-ins',
      'Community chat',
    ],
    discountPercent: 0,
    xpMultiplier: 1,
  },
  {
    id: 'explorer',
    name: 'Explorateur',
    nameEn: 'Explorer',
    icon: '🧭',
    image: `${VIP_IMG_PATH}/explorer.webp`,
    color: '#3b82f6', // blue
    minPoints: 500,
    maxPoints: 1499,
    benefits: [
      'Tous les avantages Novice',
      'Filtres avancés',
      'Statistiques détaillées',
      '5% de réduction boutique',
    ],
    benefitsEn: [
      'All Novice benefits',
      'Advanced filters',
      'Detailed statistics',
      '5% shop discount',
    ],
    discountPercent: 5,
    xpMultiplier: 1.1,
  },
  {
    id: 'adventurer',
    name: 'Aventurier',
    nameEn: 'Adventurer',
    icon: '🏔️',
    image: `${VIP_IMG_PATH}/adventurer.webp`,
    color: '#8b5cf6', // purple
    minPoints: 1500,
    maxPoints: 3999,
    benefits: [
      'Tous les avantages Explorateur',
      'Badge exclusif profil',
      'Accès prioritaire nouvelles fonctions',
      '10% de réduction boutique',
      'XP bonus +15%',
    ],
    benefitsEn: [
      'All Explorer benefits',
      'Exclusive profile badge',
      'Priority access to new features',
      '10% shop discount',
      '+15% XP bonus',
    ],
    discountPercent: 10,
    xpMultiplier: 1.15,
  },
  {
    id: 'sage',
    name: 'Sage',
    nameEn: 'Sage',
    icon: '🦉',
    image: `${VIP_IMG_PATH}/sage.webp`,
    color: '#f59e0b', // amber
    minPoints: 4000,
    maxPoints: 9999,
    benefits: [
      'Tous les avantages Aventurier',
      'Cadre profil doré',
      'Spots privés exclusifs',
      '15% de réduction boutique',
      'XP bonus +25%',
      'Support prioritaire',
    ],
    benefitsEn: [
      'All Adventurer benefits',
      'Golden profile frame',
      'Exclusive private spots',
      '15% shop discount',
      '+25% XP bonus',
      'Priority support',
    ],
    discountPercent: 15,
    xpMultiplier: 1.25,
  },
  {
    id: 'legend',
    name: 'Légende',
    nameEn: 'Legend',
    icon: '👑',
    image: `${VIP_IMG_PATH}/legend.webp`,
    color: '#ef4444', // red
    minPoints: 10000,
    maxPoints: Infinity,
    benefits: [
      'Tous les avantages Sage',
      'Titre "Légende" permanent',
      'Avatar animé exclusif',
      '20% de réduction boutique',
      'XP bonus +50%',
      'Accès bêta privée',
      'Vote sur les nouvelles fonctionnalités',
    ],
    benefitsEn: [
      'All Sage benefits',
      'Permanent "Legend" title',
      'Exclusive animated avatar',
      '20% shop discount',
      '+50% XP bonus',
      'Private beta access',
      'Vote on new features',
    ],
    discountPercent: 20,
    xpMultiplier: 1.5,
  },
];

/**
 * League definitions for competitive seasons
 */
export const leagues = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    image: `${LEAGUE_IMG_PATH}/bronze.webp`,
    color: '#cd7f32',
    minSeasonPoints: 0,
    maxSeasonPoints: 199,
  },
  {
    id: 'silver',
    name: 'Argent',
    nameEn: 'Silver',
    icon: '🥈',
    image: `${LEAGUE_IMG_PATH}/silver.webp`,
    color: '#c0c0c0',
    minSeasonPoints: 200,
    maxSeasonPoints: 499,
  },
  {
    id: 'gold',
    name: 'Or',
    nameEn: 'Gold',
    icon: '🥇',
    image: `${LEAGUE_IMG_PATH}/gold.webp`,
    color: '#ffd700',
    minSeasonPoints: 500,
    maxSeasonPoints: 999,
  },
  {
    id: 'platinum',
    name: 'Platine',
    nameEn: 'Platinum',
    icon: '💎',
    image: `${LEAGUE_IMG_PATH}/platinum.webp`,
    color: '#e5e4e2',
    minSeasonPoints: 1000,
    maxSeasonPoints: 2499,
  },
  {
    id: 'diamond',
    name: 'Diamant',
    nameEn: 'Diamond',
    icon: '💠',
    image: `${LEAGUE_IMG_PATH}/diamond.webp`,
    color: '#b9f2ff',
    minSeasonPoints: 2500,
    maxSeasonPoints: Infinity,
  },
];

/**
 * Get VIP level from points
 */
export function getVipLevel(points) {
  return vipLevels.find(
    level => points >= level.minPoints && points <= level.maxPoints
  ) || vipLevels[0];
}

/**
 * Get next VIP level
 */
export function getNextVipLevel(points) {
  const currentLevel = getVipLevel(points);
  const currentIndex = vipLevels.findIndex(l => l.id === currentLevel.id);
  return vipLevels[currentIndex + 1] || null;
}

/**
 * Get progress to next level
 */
export function getVipProgress(points) {
  const current = getVipLevel(points);
  const next = getNextVipLevel(points);

  if (!next) {
    return { current, next: null, progress: 1, pointsNeeded: 0 };
  }

  const levelRange = current.maxPoints - current.minPoints + 1;
  const pointsInLevel = points - current.minPoints;
  const progress = pointsInLevel / levelRange;

  return {
    current,
    next,
    progress,
    pointsNeeded: next.minPoints - points,
  };
}

/**
 * Get league from season points
 */
export function getLeague(seasonPoints) {
  return leagues.find(
    league => seasonPoints >= league.minSeasonPoints && seasonPoints <= league.maxSeasonPoints
  ) || leagues[0];
}

/**
 * Get next league
 */
export function getNextLeague(seasonPoints) {
  const currentLeague = getLeague(seasonPoints);
  const currentIndex = leagues.findIndex(l => l.id === currentLeague.id);
  return leagues[currentIndex + 1] || null;
}

/**
 * Get league progress
 */
export function getLeagueProgress(seasonPoints) {
  const current = getLeague(seasonPoints);
  const next = getNextLeague(seasonPoints);

  if (!next) {
    return { current, next: null, progress: 1, pointsNeeded: 0 };
  }

  const leagueRange = current.maxSeasonPoints - current.minSeasonPoints + 1;
  const pointsInLeague = seasonPoints - current.minSeasonPoints;
  const progress = pointsInLeague / leagueRange;

  return {
    current,
    next,
    progress,
    pointsNeeded: next.minSeasonPoints - seasonPoints,
  };
}

/**
 * Calculate discount for reward purchase
 */
export function applyVipDiscount(originalCost, userPoints) {
  const vipLevel = getVipLevel(userPoints);
  const discount = originalCost * (vipLevel.discountPercent / 100);
  return Math.floor(originalCost - discount);
}

/**
 * Get all VIP levels
 */
export function getAllVipLevels() {
  return vipLevels;
}

/**
 * Get all leagues
 */
export function getAllLeagues() {
  return leagues;
}

export default {
  vipLevels,
  leagues,
  getVipLevel,
  getNextVipLevel,
  getVipProgress,
  getLeague,
  getNextLeague,
  getLeagueProgress,
  applyVipDiscount,
  getAllVipLevels,
  getAllLeagues,
};
