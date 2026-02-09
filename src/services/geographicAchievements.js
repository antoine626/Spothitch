/**
 * Geographic Achievements Service (#169)
 * Handles achievements related to geographic exploration
 * Includes country milestones, regional challenges, distance records, and border crossings
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';

// European regions for regional achievements
export const EUROPEAN_REGIONS = {
  western_europe: {
    id: 'western_europe',
    name: 'Europe de l\'Ouest',
    nameEn: 'Western Europe',
    countries: ['FR', 'BE', 'NL', 'LU', 'CH', 'MC', 'DE', 'AT'],
    icon: '🏰',
    color: 'blue',
  },
  northern_europe: {
    id: 'northern_europe',
    name: 'Europe du Nord',
    nameEn: 'Northern Europe',
    countries: ['SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'LT'],
    icon: '❄️',
    color: 'cyan',
  },
  southern_europe: {
    id: 'southern_europe',
    name: 'Europe du Sud',
    nameEn: 'Southern Europe',
    countries: ['ES', 'PT', 'IT', 'GR', 'HR', 'SI', 'MT', 'CY', 'AD', 'SM', 'VA'],
    icon: '☀️',
    color: 'orange',
  },
  eastern_europe: {
    id: 'eastern_europe',
    name: 'Europe de l\'Est',
    nameEn: 'Eastern Europe',
    countries: ['PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'UA', 'BY', 'MD'],
    icon: '🌲',
    color: 'green',
  },
  balkans: {
    id: 'balkans',
    name: 'Balkans',
    nameEn: 'Balkans',
    countries: ['RS', 'BA', 'ME', 'MK', 'AL', 'XK'],
    icon: '⛰️',
    color: 'purple',
  },
  british_isles: {
    id: 'british_isles',
    name: 'Iles Britanniques',
    nameEn: 'British Isles',
    countries: ['GB', 'IE'],
    icon: '🏝️',
    color: 'emerald',
  },
};

// Geographic achievement definitions
export const GEOGRAPHIC_ACHIEVEMENTS = {
  // Country milestones
  first_country: {
    id: 'first_country',
    name: 'Premier Pays',
    nameEn: 'First Country',
    description: 'Visite ton premier pays',
    descriptionEn: 'Visit your first country',
    icon: '🚩',
    category: 'country',
    requirement: { type: 'countries', count: 1 },
    points: 25,
    rarity: 'common',
  },
  three_countries: {
    id: 'three_countries',
    name: 'Triple Frontiere',
    nameEn: 'Triple Border',
    description: 'Visite 3 pays differents',
    descriptionEn: 'Visit 3 different countries',
    icon: '🎯',
    category: 'country',
    requirement: { type: 'countries', count: 3 },
    points: 75,
    rarity: 'common',
  },
  five_countries: {
    id: 'five_countries',
    name: 'Globe-trotter',
    nameEn: 'Globetrotter',
    description: 'Visite 5 pays differents',
    descriptionEn: 'Visit 5 different countries',
    icon: '🌍',
    category: 'country',
    requirement: { type: 'countries', count: 5 },
    points: 150,
    rarity: 'rare',
  },
  ten_countries: {
    id: 'ten_countries',
    name: 'Citoyen du Monde',
    nameEn: 'World Citizen',
    description: 'Visite 10 pays differents',
    descriptionEn: 'Visit 10 different countries',
    icon: '✈️',
    category: 'country',
    requirement: { type: 'countries', count: 10 },
    points: 300,
    rarity: 'epic',
  },
  fifteen_countries: {
    id: 'fifteen_countries',
    name: 'Euro Voyageur',
    nameEn: 'Euro Voyager',
    description: 'Visite 15 pays differents',
    descriptionEn: 'Visit 15 different countries',
    icon: '🇪🇺',
    category: 'country',
    requirement: { type: 'countries', count: 15 },
    points: 500,
    rarity: 'legendary',
  },
  twenty_countries: {
    id: 'twenty_countries',
    name: 'Maitre de l\'Europe',
    nameEn: 'Master of Europe',
    description: 'Visite 20 pays differents',
    descriptionEn: 'Visit 20 different countries',
    icon: '👑',
    category: 'country',
    requirement: { type: 'countries', count: 20 },
    points: 1000,
    rarity: 'mythic',
  },

  // Regional achievements
  western_europe_complete: {
    id: 'western_europe_complete',
    name: 'Europe de l\'Ouest Complete',
    nameEn: 'Western Europe Complete',
    description: 'Visite tous les pays d\'Europe de l\'Ouest',
    descriptionEn: 'Visit all Western European countries',
    icon: '🏰',
    category: 'region',
    requirement: { type: 'region', region: 'western_europe' },
    points: 400,
    rarity: 'epic',
  },
  northern_europe_complete: {
    id: 'northern_europe_complete',
    name: 'Europe du Nord Complete',
    nameEn: 'Northern Europe Complete',
    description: 'Visite tous les pays d\'Europe du Nord',
    descriptionEn: 'Visit all Northern European countries',
    icon: '❄️',
    category: 'region',
    requirement: { type: 'region', region: 'northern_europe' },
    points: 450,
    rarity: 'epic',
  },
  southern_europe_complete: {
    id: 'southern_europe_complete',
    name: 'Europe du Sud Complete',
    nameEn: 'Southern Europe Complete',
    description: 'Visite tous les pays d\'Europe du Sud',
    descriptionEn: 'Visit all Southern European countries',
    icon: '☀️',
    category: 'region',
    requirement: { type: 'region', region: 'southern_europe' },
    points: 500,
    rarity: 'legendary',
  },
  eastern_europe_complete: {
    id: 'eastern_europe_complete',
    name: 'Europe de l\'Est Complete',
    nameEn: 'Eastern Europe Complete',
    description: 'Visite tous les pays d\'Europe de l\'Est',
    descriptionEn: 'Visit all Eastern European countries',
    icon: '🌲',
    category: 'region',
    requirement: { type: 'region', region: 'eastern_europe' },
    points: 450,
    rarity: 'epic',
  },
  balkans_complete: {
    id: 'balkans_complete',
    name: 'Balkans Complets',
    nameEn: 'Balkans Complete',
    description: 'Visite tous les pays des Balkans',
    descriptionEn: 'Visit all Balkan countries',
    icon: '⛰️',
    category: 'region',
    requirement: { type: 'region', region: 'balkans' },
    points: 350,
    rarity: 'rare',
  },
  british_isles_complete: {
    id: 'british_isles_complete',
    name: 'Iles Britanniques Completes',
    nameEn: 'British Isles Complete',
    description: 'Visite tous les pays des Iles Britanniques',
    descriptionEn: 'Visit all British Isles countries',
    icon: '🏝️',
    category: 'region',
    requirement: { type: 'region', region: 'british_isles' },
    points: 200,
    rarity: 'common',
  },

  // Distance achievements
  distance_100: {
    id: 'distance_100',
    name: 'Premiere Centaine',
    nameEn: 'First Hundred',
    description: 'Parcours 100 km en autostop',
    descriptionEn: 'Travel 100 km hitchhiking',
    icon: '🛣️',
    category: 'distance',
    requirement: { type: 'distance', km: 100 },
    points: 25,
    rarity: 'common',
  },
  distance_500: {
    id: 'distance_500',
    name: 'Routard',
    nameEn: 'Road Warrior',
    description: 'Parcours 500 km en autostop',
    descriptionEn: 'Travel 500 km hitchhiking',
    icon: '🚗',
    category: 'distance',
    requirement: { type: 'distance', km: 500 },
    points: 75,
    rarity: 'common',
  },
  distance_1000: {
    id: 'distance_1000',
    name: 'Mille Bornes',
    nameEn: 'Thousand Miles',
    description: 'Parcours 1000 km en autostop',
    descriptionEn: 'Travel 1000 km hitchhiking',
    icon: '🏎️',
    category: 'distance',
    requirement: { type: 'distance', km: 1000 },
    points: 150,
    rarity: 'rare',
  },
  distance_5000: {
    id: 'distance_5000',
    name: 'Marathon Routier',
    nameEn: 'Road Marathon',
    description: 'Parcours 5000 km en autostop',
    descriptionEn: 'Travel 5000 km hitchhiking',
    icon: '🏁',
    category: 'distance',
    requirement: { type: 'distance', km: 5000 },
    points: 400,
    rarity: 'epic',
  },
  distance_10000: {
    id: 'distance_10000',
    name: 'Trans-Europe Express',
    nameEn: 'Trans-Europe Express',
    description: 'Parcours 10000 km en autostop',
    descriptionEn: 'Travel 10000 km hitchhiking',
    icon: '🚀',
    category: 'distance',
    requirement: { type: 'distance', km: 10000 },
    points: 750,
    rarity: 'legendary',
  },

  // Border crossing achievements
  first_border: {
    id: 'first_border',
    name: 'Premiere Frontiere',
    nameEn: 'First Border',
    description: 'Traverse ta premiere frontiere en autostop',
    descriptionEn: 'Cross your first border hitchhiking',
    icon: '🚧',
    category: 'border',
    requirement: { type: 'borders', count: 1 },
    points: 50,
    rarity: 'common',
  },
  border_5: {
    id: 'border_5',
    name: 'Passeur de Frontieres',
    nameEn: 'Border Hopper',
    description: 'Traverse 5 frontieres differentes',
    descriptionEn: 'Cross 5 different borders',
    icon: '🛂',
    category: 'border',
    requirement: { type: 'borders', count: 5 },
    points: 150,
    rarity: 'rare',
  },
  border_10: {
    id: 'border_10',
    name: 'Sans Frontieres',
    nameEn: 'Borderless',
    description: 'Traverse 10 frontieres differentes',
    descriptionEn: 'Cross 10 different borders',
    icon: '🌐',
    category: 'border',
    requirement: { type: 'borders', count: 10 },
    points: 300,
    rarity: 'epic',
  },

  // Special geographic achievements
  coastline: {
    id: 'coastline',
    name: 'Cote a Cote',
    nameEn: 'Coastline',
    description: 'Visite 3 pays avec littoral',
    descriptionEn: 'Visit 3 countries with coastline',
    icon: '🏖️',
    category: 'special',
    requirement: { type: 'coastline', count: 3 },
    points: 100,
    rarity: 'common',
  },
  landlocked: {
    id: 'landlocked',
    name: 'Sans Mer',
    nameEn: 'Landlocked',
    description: 'Visite 3 pays enclaves (sans acces a la mer)',
    descriptionEn: 'Visit 3 landlocked countries',
    icon: '🏔️',
    category: 'special',
    requirement: { type: 'landlocked', count: 3 },
    points: 150,
    rarity: 'rare',
  },
  capital_cities: {
    id: 'capital_cities',
    name: 'Capitales',
    nameEn: 'Capital Cities',
    description: 'Fais un check-in dans 5 capitales',
    descriptionEn: 'Check-in at 5 capital cities',
    icon: '🏛️',
    category: 'special',
    requirement: { type: 'capitals', count: 5 },
    points: 200,
    rarity: 'rare',
  },
  islands: {
    id: 'islands',
    name: 'Insulaire',
    nameEn: 'Islander',
    description: 'Visite 2 pays insulaires',
    descriptionEn: 'Visit 2 island countries',
    icon: '🏝️',
    category: 'special',
    requirement: { type: 'islands', count: 2 },
    points: 200,
    rarity: 'rare',
  },
  micro_states: {
    id: 'micro_states',
    name: 'Micro-Nations',
    nameEn: 'Micro States',
    description: 'Visite 3 micro-etats (Monaco, Vatican, etc.)',
    descriptionEn: 'Visit 3 micro-states (Monaco, Vatican, etc.)',
    icon: '🔬',
    category: 'special',
    requirement: { type: 'microstates', count: 3 },
    points: 300,
    rarity: 'epic',
  },
};

// Country metadata for special achievements
export const COUNTRY_METADATA = {
  FR: { coastline: true, landlocked: false, island: false, microstate: false },
  DE: { coastline: true, landlocked: false, island: false, microstate: false },
  ES: { coastline: true, landlocked: false, island: false, microstate: false },
  IT: { coastline: true, landlocked: false, island: false, microstate: false },
  PT: { coastline: true, landlocked: false, island: false, microstate: false },
  GB: { coastline: true, landlocked: false, island: true, microstate: false },
  IE: { coastline: true, landlocked: false, island: true, microstate: false },
  NL: { coastline: true, landlocked: false, island: false, microstate: false },
  BE: { coastline: true, landlocked: false, island: false, microstate: false },
  CH: { coastline: false, landlocked: true, island: false, microstate: false },
  AT: { coastline: false, landlocked: true, island: false, microstate: false },
  CZ: { coastline: false, landlocked: true, island: false, microstate: false },
  SK: { coastline: false, landlocked: true, island: false, microstate: false },
  HU: { coastline: false, landlocked: true, island: false, microstate: false },
  LU: { coastline: false, landlocked: true, island: false, microstate: false },
  LI: { coastline: false, landlocked: true, island: false, microstate: true },
  MC: { coastline: true, landlocked: false, island: false, microstate: true },
  VA: { coastline: false, landlocked: true, island: false, microstate: true },
  SM: { coastline: false, landlocked: true, island: false, microstate: true },
  AD: { coastline: false, landlocked: true, island: false, microstate: true },
  MT: { coastline: true, landlocked: false, island: true, microstate: false },
  CY: { coastline: true, landlocked: false, island: true, microstate: false },
  IS: { coastline: true, landlocked: false, island: true, microstate: false },
  SE: { coastline: true, landlocked: false, island: false, microstate: false },
  NO: { coastline: true, landlocked: false, island: false, microstate: false },
  DK: { coastline: true, landlocked: false, island: false, microstate: false },
  FI: { coastline: true, landlocked: false, island: false, microstate: false },
  PL: { coastline: true, landlocked: false, island: false, microstate: false },
  GR: { coastline: true, landlocked: false, island: false, microstate: false },
  HR: { coastline: true, landlocked: false, island: false, microstate: false },
  SI: { coastline: true, landlocked: false, island: false, microstate: false },
  RS: { coastline: false, landlocked: true, island: false, microstate: false },
  MK: { coastline: false, landlocked: true, island: false, microstate: false },
  BY: { coastline: false, landlocked: true, island: false, microstate: false },
  MD: { coastline: false, landlocked: true, island: false, microstate: false },
};

// Storage keys
const STORAGE_KEY_ACHIEVEMENTS = 'spothitch_geo_achievements';
const STORAGE_KEY_BORDERS = 'spothitch_borders_crossed';
const STORAGE_KEY_CAPITALS = 'spothitch_capitals_visited';

/**
 * Get user's visited countries
 * @returns {string[]} Array of country codes
 */
export function getVisitedCountries() {
  const state = getState();
  return state.visitedCountries || [];
}

/**
 * Get user's total distance traveled
 * @returns {number} Distance in kilometers
 */
export function getTotalDistance() {
  const state = getState();
  return state.totalDistance || 0;
}

/**
 * Get crossed borders
 * @returns {string[]} Array of border codes (e.g., "FR-DE", "ES-PT")
 */
export function getCrossedBorders() {
  const stored = localStorage.getItem(STORAGE_KEY_BORDERS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Get visited capitals
 * @returns {string[]} Array of capital city names
 */
export function getVisitedCapitals() {
  const stored = localStorage.getItem(STORAGE_KEY_CAPITALS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Get unlocked geographic achievements
 * @returns {string[]} Array of achievement IDs
 */
export function getUnlockedAchievements() {
  const stored = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Check if an achievement is unlocked
 * @param {string} achievementId - Achievement ID
 * @returns {boolean} True if unlocked
 */
export function isAchievementUnlocked(achievementId) {
  return getUnlockedAchievements().includes(achievementId);
}

/**
 * Check achievement eligibility
 * @param {Object} achievement - Achievement object
 * @returns {boolean} True if eligible
 */
export function checkAchievementEligibility(achievement) {
  const { type, count, region, km } = achievement.requirement;
  const visitedCountries = getVisitedCountries();
  const totalDistance = getTotalDistance();
  const crossedBorders = getCrossedBorders();
  const visitedCapitals = getVisitedCapitals();

  switch (type) {
    case 'countries':
      return visitedCountries.length >= count;

    case 'region': {
      const regionData = EUROPEAN_REGIONS[region];
      if (!regionData) return false;
      const visitedInRegion = regionData.countries.filter((c) =>
        visitedCountries.includes(c)
      );
      return visitedInRegion.length >= regionData.countries.length;
    }

    case 'distance':
      return totalDistance >= km;

    case 'borders':
      return crossedBorders.length >= count;

    case 'coastline': {
      const coastlineCountries = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.coastline === true
      );
      return coastlineCountries.length >= count;
    }

    case 'landlocked': {
      const landlockedCountries = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.landlocked === true
      );
      return landlockedCountries.length >= count;
    }

    case 'capitals':
      return visitedCapitals.length >= count;

    case 'islands': {
      const islandCountries = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.island === true
      );
      return islandCountries.length >= count;
    }

    case 'microstates': {
      const microstates = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.microstate === true
      );
      return microstates.length >= count;
    }

    default:
      return false;
  }
}

/**
 * Check and unlock new achievements
 * @returns {Object[]} Array of newly unlocked achievements
 */
export function checkAndUnlockAchievements() {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked = [];

  Object.values(GEOGRAPHIC_ACHIEVEMENTS).forEach((achievement) => {
    if (!unlocked.includes(achievement.id)) {
      if (checkAchievementEligibility(achievement)) {
        newlyUnlocked.push(achievement);
      }
    }
  });

  // Save newly unlocked achievements
  if (newlyUnlocked.length > 0) {
    const newUnlockedIds = newlyUnlocked.map((a) => a.id);
    localStorage.setItem(
      STORAGE_KEY_ACHIEVEMENTS,
      JSON.stringify([...unlocked, ...newUnlockedIds])
    );

    // Award points and show notifications
    newlyUnlocked.forEach((achievement) => {
      addPoints(achievement.points, `geo_achievement_${achievement.id}`);
      showAchievementNotification(achievement);
    });
  }

  return newlyUnlocked;
}

/**
 * Show achievement notification
 * @param {Object} achievement - Achievement object
 */
function showAchievementNotification(achievement) {
  const message = `${achievement.icon} ${t('achievementUnlocked')}: ${achievement.name}`;
  showToast(message, 'success');

  // Trigger celebration animation if available
  if (window.showBadgeUnlock) {
    window.showBadgeUnlock({
      id: achievement.id,
      name: achievement.name,
      icon: achievement.icon,
      rarity: achievement.rarity,
    });
  }
}

/**
 * Record a country visit
 * @param {string} countryCode - ISO country code
 * @returns {Object[]} Newly unlocked achievements
 */
export function recordCountryVisit(countryCode) {
  if (!countryCode) return [];

  const state = getState();
  const visitedCountries = state.visitedCountries || [];

  if (!visitedCountries.includes(countryCode)) {
    setState({
      visitedCountries: [...visitedCountries, countryCode],
      countriesVisited: visitedCountries.length + 1,
    });
  }

  return checkAndUnlockAchievements();
}

/**
 * Record a border crossing
 * @param {string} fromCountry - Source country code
 * @param {string} toCountry - Destination country code
 * @returns {Object[]} Newly unlocked achievements
 */
export function recordBorderCrossing(fromCountry, toCountry) {
  if (!fromCountry || !toCountry || fromCountry === toCountry) return [];

  const borders = getCrossedBorders();
  const borderCode = [fromCountry, toCountry].sort().join('-');

  if (!borders.includes(borderCode)) {
    localStorage.setItem(
      STORAGE_KEY_BORDERS,
      JSON.stringify([...borders, borderCode])
    );
  }

  return checkAndUnlockAchievements();
}

/**
 * Record distance traveled
 * @param {number} km - Distance in kilometers
 * @returns {Object[]} Newly unlocked achievements
 */
export function recordDistance(km) {
  if (!km || km <= 0) return [];

  const state = getState();
  const currentDistance = state.totalDistance || 0;
  setState({ totalDistance: currentDistance + km });

  return checkAndUnlockAchievements();
}

/**
 * Record capital city visit
 * @param {string} capitalName - Name of the capital city
 * @returns {Object[]} Newly unlocked achievements
 */
export function recordCapitalVisit(capitalName) {
  if (!capitalName) return [];

  const capitals = getVisitedCapitals();

  if (!capitals.includes(capitalName)) {
    localStorage.setItem(
      STORAGE_KEY_CAPITALS,
      JSON.stringify([...capitals, capitalName])
    );
  }

  return checkAndUnlockAchievements();
}

/**
 * Get all achievements grouped by category
 * @returns {Object} Achievements grouped by category
 */
export function getAchievementsByCategory() {
  const categories = {};
  const unlocked = getUnlockedAchievements();

  Object.values(GEOGRAPHIC_ACHIEVEMENTS).forEach((achievement) => {
    if (!categories[achievement.category]) {
      categories[achievement.category] = [];
    }
    categories[achievement.category].push({
      ...achievement,
      isUnlocked: unlocked.includes(achievement.id),
    });
  });

  return categories;
}

/**
 * Get progress for a specific achievement
 * @param {string} achievementId - Achievement ID
 * @returns {Object} Progress object with current and target values
 */
export function getAchievementProgress(achievementId) {
  const achievement = GEOGRAPHIC_ACHIEVEMENTS[achievementId];
  if (!achievement) return null;

  const { type, count, region, km } = achievement.requirement;
  const visitedCountries = getVisitedCountries();
  const totalDistance = getTotalDistance();
  const crossedBorders = getCrossedBorders();
  const visitedCapitals = getVisitedCapitals();

  let current = 0;
  let target = count || km || 0;

  switch (type) {
    case 'countries':
      current = visitedCountries.length;
      target = count;
      break;

    case 'region': {
      const regionData = EUROPEAN_REGIONS[region];
      if (regionData) {
        current = regionData.countries.filter((c) =>
          visitedCountries.includes(c)
        ).length;
        target = regionData.countries.length;
      }
      break;
    }

    case 'distance':
      current = totalDistance;
      target = km;
      break;

    case 'borders':
      current = crossedBorders.length;
      target = count;
      break;

    case 'coastline':
      current = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.coastline === true
      ).length;
      target = count;
      break;

    case 'landlocked':
      current = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.landlocked === true
      ).length;
      target = count;
      break;

    case 'capitals':
      current = visitedCapitals.length;
      target = count;
      break;

    case 'islands':
      current = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.island === true
      ).length;
      target = count;
      break;

    case 'microstates':
      current = visitedCountries.filter(
        (c) => COUNTRY_METADATA[c]?.microstate === true
      ).length;
      target = count;
      break;
  }

  return {
    current,
    target,
    percentage: Math.min(100, Math.floor((current / target) * 100)),
    isComplete: current >= target,
  };
}

/**
 * Get regional progress
 * @param {string} regionId - Region ID
 * @returns {Object} Region progress with visited/total countries
 */
export function getRegionalProgress(regionId) {
  const region = EUROPEAN_REGIONS[regionId];
  if (!region) return null;

  const visitedCountries = getVisitedCountries();
  const visitedInRegion = region.countries.filter((c) =>
    visitedCountries.includes(c)
  );

  return {
    region,
    visited: visitedInRegion,
    visitedCount: visitedInRegion.length,
    totalCount: region.countries.length,
    percentage: Math.floor(
      (visitedInRegion.length / region.countries.length) * 100
    ),
    isComplete: visitedInRegion.length >= region.countries.length,
    remaining: region.countries.filter((c) => !visitedCountries.includes(c)),
  };
}

/**
 * Get summary statistics
 * @returns {Object} Summary of geographic achievements
 */
export function getGeographicSummary() {
  const unlocked = getUnlockedAchievements();
  const total = Object.keys(GEOGRAPHIC_ACHIEVEMENTS).length;
  const visitedCountries = getVisitedCountries();
  const totalDistance = getTotalDistance();
  const crossedBorders = getCrossedBorders();

  // Calculate total points earned
  const pointsEarned = unlocked.reduce((sum, id) => {
    const achievement = GEOGRAPHIC_ACHIEVEMENTS[id];
    return sum + (achievement?.points || 0);
  }, 0);

  return {
    achievementsUnlocked: unlocked.length,
    achievementsTotal: total,
    achievementsPercentage: Math.floor((unlocked.length / total) * 100),
    countriesVisited: visitedCountries.length,
    totalDistance,
    bordersCrossed: crossedBorders.length,
    pointsEarned,
  };
}

/**
 * Render achievement card HTML
 * @param {Object} achievement - Achievement object
 * @param {boolean} showProgress - Whether to show progress bar
 * @returns {string} HTML string
 */
export function renderAchievementCard(achievement, showProgress = true) {
  const isUnlocked = isAchievementUnlocked(achievement.id);
  const progress = showProgress ? getAchievementProgress(achievement.id) : null;

  const rarityColors = {
    common: 'bg-gray-500/20 border-gray-400',
    rare: 'bg-blue-500/20 border-blue-400',
    epic: 'bg-purple-500/20 border-purple-400',
    legendary: 'bg-yellow-500/20 border-yellow-400',
    mythic: 'bg-pink-500/20 border-pink-400',
  };

  const rarityTextColors = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };

  return `
    <div class="achievement-card p-4 rounded-lg border ${rarityColors[achievement.rarity] || rarityColors.common} ${isUnlocked ? 'opacity-100' : 'opacity-60'}">
      <div class="flex items-start gap-3">
        <div class="text-3xl ${isUnlocked ? '' : 'grayscale'}">${achievement.icon}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-white">${achievement.name}</h4>
            ${isUnlocked ? '<span class="text-green-400"><i class="fas fa-check-circle"></i></span>' : ''}
          </div>
          <p class="text-sm text-gray-400">${achievement.description}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs ${rarityTextColors[achievement.rarity]}">${t('badgeRarity_' + achievement.rarity)}</span>
            <span class="text-xs text-gray-500">|</span>
            <span class="text-xs text-primary-400">+${achievement.points} pts</span>
          </div>
          ${
            showProgress && progress && !isUnlocked
              ? `
            <div class="mt-2">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>${progress.current}/${progress.target}</span>
                <span>${progress.percentage}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-primary-500 transition-all" style="width: ${progress.percentage}%"></div>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Render region card HTML
 * @param {string} regionId - Region ID
 * @returns {string} HTML string
 */
export function renderRegionCard(regionId) {
  const progress = getRegionalProgress(regionId);
  if (!progress) return '';

  return `
    <div class="region-card p-4 rounded-lg bg-dark-secondary">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">${progress.region.icon}</span>
        <div>
          <h4 class="font-medium text-white">${progress.region.name}</h4>
          <p class="text-sm text-gray-400">${progress.visitedCount}/${progress.totalCount} ${t('countriesVisited')}</p>
        </div>
      </div>
      <div class="mb-2">
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-${progress.region.color}-500 transition-all" style="width: ${progress.percentage}%"></div>
        </div>
      </div>
      ${
        progress.isComplete
          ? `<div class="text-green-400 text-sm"><i class="fas fa-check-circle mr-1"></i>${t('regionComplete')}</div>`
          : `<div class="text-xs text-gray-400">${t('remaining')}: ${progress.remaining.join(', ')}</div>`
      }
    </div>
  `;
}

// Export all functions as default object
export default {
  EUROPEAN_REGIONS,
  GEOGRAPHIC_ACHIEVEMENTS,
  COUNTRY_METADATA,
  getVisitedCountries,
  getTotalDistance,
  getCrossedBorders,
  getVisitedCapitals,
  getUnlockedAchievements,
  isAchievementUnlocked,
  checkAchievementEligibility,
  checkAndUnlockAchievements,
  recordCountryVisit,
  recordBorderCrossing,
  recordDistance,
  recordCapitalVisit,
  getAchievementsByCategory,
  getAchievementProgress,
  getRegionalProgress,
  getGeographicSummary,
  renderAchievementCard,
  renderRegionCard,
};
