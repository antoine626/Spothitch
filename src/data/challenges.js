/**
 * Challenge Definitions
 * Weekly, monthly, and annual challenges
 */

export const allChallenges = {
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

  monthly: [
    {
      id: 'monthly_spots',
      name: 'Grand Cartographe',
      nameEn: 'Great Cartographer',
      description: 'Ajoute 10 nouveaux spots ce mois',
      descriptionEn: 'Add 10 new spots this month',
      icon: '🗺️',
      target: 10,
      type: 'spotsCreated',
      points: 200,
      xp: 400,
    },
    {
      id: 'monthly_reviews',
      name: 'Critique Expert',
      nameEn: 'Expert Critic',
      description: 'Laisse 20 avis ce mois',
      descriptionEn: 'Leave 20 reviews this month',
      icon: '📝',
      target: 20,
      type: 'reviews',
      points: 150,
      xp: 300,
    },
    {
      id: 'monthly_checkins',
      name: 'Infatigable',
      nameEn: 'Tireless',
      description: 'Fais 30 check-ins ce mois',
      descriptionEn: 'Do 30 check-ins this month',
      icon: '🎯',
      target: 30,
      type: 'checkins',
      points: 250,
      xp: 500,
    },
    {
      id: 'monthly_countries',
      name: 'Globe-trotter',
      nameEn: 'Globe-trotter',
      description: 'Visite des spots dans 3 pays différents ce mois',
      descriptionEn: 'Visit spots in 3 different countries this month',
      icon: '🌍',
      target: 3,
      type: 'countriesVisited',
      points: 180,
      xp: 360,
    },
  ],

  annual: [
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
 * Get monthly challenges
 */
export function getMonthlyChallenges() {
  // Rotate based on month of year
  const monthOfYear = new Date().getMonth();
  const challenges = [...allChallenges.monthly];
  const start = monthOfYear % challenges.length;
  return [
    challenges[start],
    challenges[(start + 1) % challenges.length],
    challenges[(start + 2) % challenges.length],
  ];
}

/**
 * Get all annual challenges
 */
export function getAnnualChallenges() {
  return allChallenges.annual;
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
    weekly: getWeeklyChallenges().map(c => getChallengeProgress(c, userStats)),
    monthly: getMonthlyChallenges().map(c => getChallengeProgress(c, userStats)),
    annual: getAnnualChallenges().map(c => getChallengeProgress(c, userStats)),
  };
}

export default {
  allChallenges,
  getWeeklyChallenges,
  getMonthlyChallenges,
  getAnnualChallenges,
  getChallengeProgress,
  getActiveChallenges,
};
