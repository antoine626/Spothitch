/**
 * Challenge Definitions
 * Daily, weekly, and long-term challenges
 */

export const allChallenges = {
  daily: [
    {
      id: 'daily_checkin',
      name: 'Check-in du jour',
      nameEn: 'Daily Check-in',
      description: 'Fais un check-in aujourd\'hui',
      descriptionEn: 'Do a check-in today',
      icon: '📍',
      target: 1,
      type: 'checkins',
      points: 10,
      xp: 25,
    },
    {
      id: 'daily_review',
      name: 'Avis quotidien',
      nameEn: 'Daily Review',
      description: 'Laisse un avis sur un spot',
      descriptionEn: 'Leave a review on a spot',
      icon: '⭐',
      target: 1,
      type: 'reviews',
      points: 15,
      xp: 30,
    },
    {
      id: 'daily_chat',
      name: 'Social du jour',
      nameEn: 'Daily Social',
      description: 'Envoie 3 messages dans le chat',
      descriptionEn: 'Send 3 messages in chat',
      icon: '💬',
      target: 3,
      type: 'messages',
      points: 10,
      xp: 20,
    },
    {
      id: 'daily_explore',
      name: 'Découverte',
      nameEn: 'Discovery',
      description: 'Consulte 5 spots différents',
      descriptionEn: 'View 5 different spots',
      icon: '🔍',
      target: 5,
      type: 'spotsViewed',
      points: 10,
      xp: 15,
    },
  ],

  weekly: [
    {
      id: 'weekly_spots',
      name: 'Cartographe',
      nameEn: 'Cartographer',
      description: 'Ajoute 2 nouveaux spots cette semaine',
      descriptionEn: 'Add 2 new spots this week',
      icon: '🗺️',
      target: 2,
      type: 'spotsCreated',
      points: 50,
      xp: 100,
    },
    {
      id: 'weekly_reviews',
      name: 'Critique Hebdo',
      nameEn: 'Weekly Critic',
      description: 'Laisse 5 avis cette semaine',
      descriptionEn: 'Leave 5 reviews this week',
      icon: '📝',
      target: 5,
      type: 'reviews',
      points: 40,
      xp: 80,
    },
    {
      id: 'weekly_checkins',
      name: 'Actif',
      nameEn: 'Active',
      description: 'Fais 7 check-ins cette semaine',
      descriptionEn: 'Do 7 check-ins this week',
      icon: '🎯',
      target: 7,
      type: 'checkins',
      points: 60,
      xp: 120,
    },
    {
      id: 'weekly_help',
      name: 'Entraide',
      nameEn: 'Mutual Aid',
      description: 'Aide 3 personnes dans le chat',
      descriptionEn: 'Help 3 people in chat',
      icon: '🤝',
      target: 3,
      type: 'helpfulMessages',
      points: 45,
      xp: 90,
    },
    {
      id: 'weekly_photos',
      name: 'Photographe',
      nameEn: 'Photographer',
      description: 'Ajoute 3 photos à des spots',
      descriptionEn: 'Add 3 photos to spots',
      icon: '📸',
      target: 3,
      type: 'photosAdded',
      points: 35,
      xp: 70,
    },
  ],

  longterm: [
    {
      id: 'lt_europe',
      name: 'Tour d\'Europe',
      nameEn: 'World Tour',
      description: 'Visite des spots dans 10 pays differents',
      descriptionEn: 'Visit spots in 10 different countries',
      icon: '🇪🇺',
      target: 10,
      type: 'countriesVisited',
      points: 500,
      xp: 1000,
    },
    {
      id: 'lt_veteran',
      name: 'Vétéran',
      nameEn: 'Veteran',
      description: 'Fais 100 check-ins au total',
      descriptionEn: 'Complete 100 check-ins total',
      icon: '🏆',
      target: 100,
      type: 'totalCheckins',
      points: 300,
      xp: 600,
    },
    {
      id: 'lt_contributor',
      name: 'Grand Contributeur',
      nameEn: 'Grand Contributor',
      description: 'Ajoute 50 spots à la communauté',
      descriptionEn: 'Add 50 spots to the community',
      icon: '🌟',
      target: 50,
      type: 'totalSpotsCreated',
      points: 400,
      xp: 800,
    },
    {
      id: 'lt_guide',
      name: 'Guide Expert',
      nameEn: 'Expert Guide',
      description: 'Rédige 100 avis',
      descriptionEn: 'Write 100 reviews',
      icon: '📚',
      target: 100,
      type: 'totalReviews',
      points: 350,
      xp: 700,
    },
    {
      id: 'lt_streak',
      name: 'Marathonien',
      nameEn: 'Marathoner',
      description: 'Maintiens une série de 30 jours',
      descriptionEn: 'Maintain a 30-day streak',
      icon: '🔥',
      target: 30,
      type: 'maxStreak',
      points: 250,
      xp: 500,
    },
    {
      id: 'lt_perfect_spots',
      name: 'Perfectionniste',
      nameEn: 'Perfectionist',
      description: 'Aie 10 spots notés 5 étoiles',
      descriptionEn: 'Have 10 spots rated 5 stars',
      icon: '⭐',
      target: 10,
      type: 'fiveStarSpots',
      points: 200,
      xp: 400,
    },
  ],
};

/**
 * Get daily challenges
 */
export function getDailyChallenges() {
  // Rotate based on day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const challenges = [...allChallenges.daily];
  const start = dayOfYear % challenges.length;
  return [
    challenges[start],
    challenges[(start + 1) % challenges.length],
    challenges[(start + 2) % challenges.length],
  ];
}

/**
 * Get weekly challenges
 */
export function getWeeklyChallenges() {
  // Rotate based on week number
  const weekOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (7 * 86400000)
  );
  const challenges = [...allChallenges.weekly];
  const start = weekOfYear % challenges.length;
  return [
    challenges[start],
    challenges[(start + 1) % challenges.length],
    challenges[(start + 2) % challenges.length],
  ];
}

/**
 * Get all long-term challenges
 */
export function getLongtermChallenges() {
  return allChallenges.longterm;
}

/**
 * Calculate challenge progress
 */
export function getChallengeProgress(challenge, userStats) {
  const current = userStats[challenge.type] || 0;
  const progress = Math.min(current / challenge.target, 1);
  return {
    ...challenge,
    current,
    progress,
    completed: current >= challenge.target,
    remaining: Math.max(0, challenge.target - current),
  };
}

/**
 * Get all active challenges with progress
 */
export function getActiveChallenges(userStats) {
  return {
    daily: getDailyChallenges().map(c => getChallengeProgress(c, userStats)),
    weekly: getWeeklyChallenges().map(c => getChallengeProgress(c, userStats)),
    longterm: getLongtermChallenges().map(c => getChallengeProgress(c, userStats)),
  };
}

export default {
  allChallenges,
  getDailyChallenges,
  getWeeklyChallenges,
  getLongtermChallenges,
  getChallengeProgress,
  getActiveChallenges,
};
