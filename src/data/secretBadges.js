/**
 * Secret Badge Definitions
 * Hidden achievements users discover by surprise
 */

// Base path for badge images
const BASE = import.meta.env.BASE_URL || '/';
const BADGE_IMG_PATH = `${BASE}images/badges`;

/**
 * Secret badges - these are NOT shown in the badge list until unlocked
 * Each badge has a unique condition that's not obvious to users
 */
export const secretBadges = [
  {
    id: 'secret_noctambule',
    name: 'Noctambule',
    nameEn: 'Night Rider',
    description: 'Check-in entre 3h et 5h du matin',
    descriptionEn: 'Check-in between 3am and 5am',
    icon: '🌙',
    image: `${BADGE_IMG_PATH}/secret-night.webp`,
    points: 100,
    // Condition: checkin hour between 3 and 5
    condition: (context) => {
      const hour = context.checkinHour;
      return hour >= 3 && hour < 5;
    },
  },
  {
    id: 'secret_early_bird',
    name: 'Leve-tot',
    nameEn: 'Early Riser',
    description: 'Check-in avant 6h du matin',
    descriptionEn: 'Check-in before 6am',
    icon: '🌅',
    image: `${BADGE_IMG_PATH}/secret-early.webp`,
    points: 100,
    // Condition: checkin hour before 6
    condition: (context) => {
      const hour = context.checkinHour;
      return hour >= 0 && hour < 6;
    },
  },
  {
    id: 'secret_sans_frontieres',
    name: 'Sans frontieres',
    nameEn: 'Borderless',
    description: 'Check-in dans 3 pays differents la meme semaine',
    descriptionEn: 'Check-in in 3 different countries in the same week',
    icon: '🌍',
    image: `${BADGE_IMG_PATH}/secret-borderless.webp`,
    points: 100,
    // Condition: 3+ different countries in the last 7 days
    condition: (context) => {
      const countriesThisWeek = context.countriesThisWeek || [];
      return countriesThisWeek.length >= 3;
    },
  },
  {
    id: 'secret_fidele',
    name: 'Fidele',
    nameEn: 'Loyal',
    description: '10 check-ins sur le meme spot',
    descriptionEn: '10 check-ins on the same spot',
    icon: '💝',
    image: `${BADGE_IMG_PATH}/secret-loyal.webp`,
    points: 100,
    // Condition: 10+ checkins on any single spot
    condition: (context) => {
      const spotCheckins = context.spotCheckins || {};
      return Object.values(spotCheckins).some(count => count >= 10);
    },
  },
  {
    id: 'secret_explorateur_solitaire',
    name: 'Explorateur solitaire',
    nameEn: 'Lone Explorer',
    description: 'Premier check-in sur un spot jamais utilise',
    descriptionEn: 'First check-in on a never-used spot',
    icon: '🏔️',
    image: `${BADGE_IMG_PATH}/secret-explorer.webp`,
    points: 100,
    // Condition: checking in on a spot with 0 previous checkins
    condition: (context) => {
      return context.isFirstEverCheckin === true;
    },
  },
  {
    id: 'secret_premier',
    name: 'Premier !',
    nameEn: 'First!',
    description: 'Premier check-in sur un nouveau spot',
    descriptionEn: 'First check-in on a new spot',
    icon: '🥇',
    image: `${BADGE_IMG_PATH}/secret-first.webp`,
    points: 100,
    // Condition: first person to check-in on a newly created spot
    condition: (context) => {
      return context.isFirstOnNewSpot === true;
    },
  },
  {
    id: 'secret_collectionneur',
    name: 'Collectionneur',
    nameEn: 'Collector',
    description: '50 spots differents utilises',
    descriptionEn: '50 different spots used',
    icon: '🎯',
    image: `${BADGE_IMG_PATH}/secret-collector.webp`,
    points: 100,
    // Condition: 50+ unique spots visited
    condition: (context) => {
      const uniqueSpots = context.uniqueSpotsVisited || 0;
      return uniqueSpots >= 50;
    },
  },
  {
    id: 'secret_marathonien',
    name: 'Marathonien',
    nameEn: 'Marathon Runner',
    description: '5 check-ins en une seule journee',
    descriptionEn: '5 check-ins in a single day',
    icon: '🏃',
    image: `${BADGE_IMG_PATH}/secret-marathon.webp`,
    points: 100,
    // Condition: 5+ checkins today
    condition: (context) => {
      const checkinsToday = context.checkinsToday || 0;
      return checkinsToday >= 5;
    },
  },
  {
    id: 'secret_chanceux',
    name: 'Chanceux',
    nameEn: 'Lucky One',
    description: 'Check-in le 13 du mois a 13h13',
    descriptionEn: 'Check-in on the 13th at 13:13',
    icon: '🍀',
    image: `${BADGE_IMG_PATH}/secret-lucky.webp`,
    points: 100,
    // Condition: date is 13th and time is 13:13
    condition: (context) => {
      const now = context.checkinDate || new Date();
      return now.getDate() === 13 && now.getHours() === 13 && now.getMinutes() === 13;
    },
  },
  {
    id: 'secret_centenaire',
    name: 'Centenaire',
    nameEn: 'Centennial',
    description: '100eme check-in',
    descriptionEn: '100th check-in',
    icon: '💯',
    image: `${BADGE_IMG_PATH}/secret-100.webp`,
    points: 100,
    // Condition: exactly 100 total checkins
    condition: (context) => {
      return context.totalCheckins === 100;
    },
  },
];

/**
 * Get a secret badge by ID
 * @param {string} badgeId - Badge ID
 * @returns {Object|undefined} Badge object
 */
export function getSecretBadgeById(badgeId) {
  return secretBadges.find(b => b.id === badgeId);
}

/**
 * Get all secret badge IDs
 * @returns {string[]} Array of badge IDs
 */
export function getAllSecretBadgeIds() {
  return secretBadges.map(b => b.id);
}

/**
 * Get earned secret badges
 * @param {string[]} earnedIds - Array of earned badge IDs
 * @returns {Object[]} Array of earned secret badges
 */
export function getEarnedSecretBadges(earnedIds = []) {
  return secretBadges.filter(b => earnedIds.includes(b.id));
}

/**
 * Get unearned secret badges count (for mystery display)
 * @param {string[]} earnedIds - Array of earned badge IDs
 * @returns {number} Count of unearned secret badges
 */
export function getUnearnedSecretBadgeCount(earnedIds = []) {
  return secretBadges.filter(b => !earnedIds.includes(b.id)).length;
}

export default {
  secretBadges,
  getSecretBadgeById,
  getAllSecretBadgeIds,
  getEarnedSecretBadges,
  getUnearnedSecretBadgeCount,
};
