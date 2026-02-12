/**
 * Badge Definitions
 * Achievements users can unlock
 */

// Base path for badge images (use import.meta.env.BASE_URL for correct path resolution)
const BASE = import.meta.env.BASE_URL || '/';
const BADGE_IMG_PATH = `${BASE}images/badges`;

export const allBadges = [
  // Beginner badges
  {
    id: 'first_checkin',
    name: 'Premier Pas',
    nameEn: 'First Step',
    description: 'Effectue ton premier check-in',
    descriptionEn: 'Complete your first check-in',
    icon: '👣',
    image: `${BADGE_IMG_PATH}/first-checkin.webp`,
    category: 'beginner',
    condition: (stats) => stats.checkins >= 1,
    points: 10,
  },
  {
    id: 'first_spot',
    name: 'Contributeur',
    nameEn: 'Contributor',
    description: 'Partage ton premier spot',
    descriptionEn: 'Share your first spot',
    icon: '📍',
    image: `${BADGE_IMG_PATH}/first-spot.webp`,
    category: 'beginner',
    condition: (stats) => stats.spotsCreated >= 1,
    points: 20,
  },
  {
    id: 'first_review',
    name: 'Critique',
    nameEn: 'Reviewer',
    description: 'Laisse ton premier avis',
    descriptionEn: 'Leave your first review',
    icon: '✍️',
    image: `${BADGE_IMG_PATH}/first-review.webp`,
    category: 'beginner',
    condition: (stats) => stats.reviewsGiven >= 1,
    points: 15,
  },

  // Progress badges
  {
    id: 'checkin_10',
    name: 'Habitué',
    nameEn: 'Regular',
    description: '10 check-ins effectués',
    descriptionEn: '10 check-ins completed',
    icon: '🎯',
    image: `${BADGE_IMG_PATH}/explorer-10.webp`,
    category: 'progress',
    condition: (stats) => stats.checkins >= 10,
    points: 50,
  },
  {
    id: 'checkin_50',
    name: 'Vétéran',
    nameEn: 'Veteran',
    description: '50 check-ins effectués',
    descriptionEn: '50 check-ins completed',
    icon: '🏅',
    image: `${BADGE_IMG_PATH}/expert-50.webp`,
    category: 'progress',
    condition: (stats) => stats.checkins >= 50,
    points: 100,
  },
  {
    id: 'checkin_100',
    name: 'Légende',
    nameEn: 'Legend',
    description: '100 check-ins effectués',
    descriptionEn: '100 check-ins completed',
    icon: '🏆',
    image: `${BADGE_IMG_PATH}/master-100.webp`,
    category: 'progress',
    condition: (stats) => stats.checkins >= 100,
    points: 200,
  },
  {
    id: 'spots_5',
    name: 'Cartographe',
    nameEn: 'Cartographer',
    description: '5 spots partagés',
    descriptionEn: '5 spots shared',
    icon: '🗺️',
    image: `${BADGE_IMG_PATH}/cartographer.webp`,
    category: 'progress',
    condition: (stats) => stats.spotsCreated >= 5,
    points: 75,
  },
  {
    id: 'spots_20',
    name: 'Explorateur',
    nameEn: 'Explorer',
    description: '20 spots partagés',
    descriptionEn: '20 spots shared',
    icon: '🧭',
    image: `${BADGE_IMG_PATH}/mapper.webp`,
    category: 'progress',
    condition: (stats) => stats.spotsCreated >= 20,
    points: 150,
  },
  {
    id: 'reviews_10',
    name: 'Guide Local',
    nameEn: 'Local Guide',
    description: '10 avis donnés',
    descriptionEn: '10 reviews given',
    icon: '📝',
    image: `${BADGE_IMG_PATH}/critic.webp`,
    category: 'progress',
    condition: (stats) => stats.reviewsGiven >= 10,
    points: 60,
  },
  {
    id: 'reviews_25',
    name: 'Expert',
    nameEn: 'Expert',
    description: '25 avis donnés',
    descriptionEn: '25 reviews given',
    icon: '🎓',
    image: `${BADGE_IMG_PATH}/influencer.webp`,
    category: 'progress',
    condition: (stats) => stats.reviewsGiven >= 25,
    points: 120,
  },

  // Special badges
  {
    id: 'night_owl',
    name: 'Hibou',
    nameEn: 'Night Owl',
    description: 'Check-in après minuit',
    descriptionEn: 'Check-in after midnight',
    icon: '🦉',
    image: `${BADGE_IMG_PATH}/night-owl.webp`,
    category: 'special',
    condition: (stats) => stats.nightCheckin === true,
    points: 30,
  },
  {
    id: 'early_bird',
    name: 'Lève-tôt',
    nameEn: 'Early Bird',
    description: 'Check-in avant 6h',
    descriptionEn: 'Check-in before 6am',
    icon: '🐦',
    image: `${BADGE_IMG_PATH}/early-bird.webp`,
    category: 'special',
    condition: (stats) => stats.earlyCheckin === true,
    points: 30,
  },
  {
    id: 'helper',
    name: 'Bon Samaritain',
    nameEn: 'Good Samaritan',
    description: 'Aide 5 personnes dans le chat',
    descriptionEn: 'Help 5 people in chat',
    icon: '🤝',
    image: `${BADGE_IMG_PATH}/helping-hand.webp`,
    category: 'special',
    condition: (stats) => stats.helpfulMessages >= 5,
    points: 80,
  },
  {
    id: 'globetrotter',
    name: 'Globe-trotter',
    nameEn: 'Globetrotter',
    description: 'Visite 5 pays différents',
    descriptionEn: 'Visit 5 different countries',
    icon: '🌍',
    category: 'special',
    condition: (stats) => stats.countriesVisited >= 5,
    points: 150,
  },
  {
    id: 'world_traveler',
    name: 'Citoyen du Monde',
    nameEn: 'World Citizen',
    description: 'Visite 10 pays différents',
    descriptionEn: 'Visit 10 different countries',
    icon: '✈️',
    category: 'special',
    condition: (stats) => stats.countriesVisited >= 10,
    points: 300,
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    nameEn: 'Quiz Master',
    description: 'Score parfait au quiz',
    descriptionEn: 'Perfect quiz score',
    icon: '🧠',
    category: 'special',
    condition: (stats) => stats.perfectQuiz === true,
    points: 100,
  },
  {
    id: 'verified_spotter',
    name: 'Vérificateur',
    nameEn: 'Verifier',
    description: '10 spots vérifiés',
    descriptionEn: '10 verified spots',
    icon: '✅',
    category: 'special',
    condition: (stats) => stats.verifiedSpots >= 10,
    points: 120,
  },
  {
    id: 'legend',
    name: 'Légende Vivante',
    nameEn: 'Living Legend',
    description: 'Atteins 10000 points',
    descriptionEn: 'Reach 10000 points',
    icon: '👑',
    image: `${BADGE_IMG_PATH}/legend.webp`,
    category: 'special',
    condition: (stats) => stats.totalPoints >= 10000,
    points: 500,
  },
];

/**
 * Get badges by category
 */
export function getBadgesByCategory(category) {
  return allBadges.filter(b => b.category === category);
}

/**
 * Get earned badges for a user
 */
export function getEarnedBadges(userStats, earnedBadgeIds = []) {
  return allBadges.filter(
    badge => earnedBadgeIds.includes(badge.id) || badge.condition(userStats)
  );
}

/**
 * Get next badges to unlock
 */
export function getNextBadges(userStats, earnedBadgeIds = [], limit = 3) {
  return allBadges
    .filter(badge => !earnedBadgeIds.includes(badge.id) && !badge.condition(userStats))
    .slice(0, limit);
}

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId) {
  return allBadges.find(b => b.id === badgeId);
}

/**
 * Calculate total badge points
 */
export function getTotalBadgePoints(earnedBadgeIds = []) {
  return allBadges
    .filter(b => earnedBadgeIds.includes(b.id))
    .reduce((sum, b) => sum + b.points, 0);
}

export default {
  allBadges,
  getBadgesByCategory,
  getEarnedBadges,
  getNextBadges,
  getBadgeById,
  getTotalBadgePoints,
};
