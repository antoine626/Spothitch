/**
 * Stats Calculator Service
 * Calculates detailed travel statistics from check-in history
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';

// Cache key for calculated stats
const STATS_CACHE_KEY = 'travel_stats_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fun distance comparisons
 */
const DISTANCE_COMPARISONS = [
  { km: 100, emoji: '🚶', text: 'Un marathon x2.5 !' },
  { km: 300, emoji: '🚅', text: 'Paris-Lyon en TGV' },
  { km: 500, emoji: '🇫🇷', text: 'Traversee de la France' },
  { km: 800, emoji: '🏔️', text: 'Paris-Marseille' },
  { km: 1500, emoji: '🌍', text: 'Paris-Barcelone' },
  { km: 2500, emoji: '✈️', text: 'Paris-Moscou' },
  { km: 4000, emoji: '🗺️', text: 'Traversee de l\'Europe' },
  { km: 6000, emoji: '🌐', text: 'Paris-New York (a vol d\'oiseau)' },
  { km: 10000, emoji: '🚀', text: 'Un quart du tour du monde !' },
  { km: 20000, emoji: '🌎', text: 'La moitie du tour du monde !' },
  { km: 40000, emoji: '🌍', text: 'Le tour de la Terre !' },
];

/**
 * Get fun comparison for distance traveled
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} Comparison with emoji and text
 */
export function getDistanceComparison(distanceKm) {
  if (!distanceKm || distanceKm < 50) {
    return { emoji: '🚶', text: 'Continue a voyager pour debloquer des comparaisons !' };
  }

  // Find the highest matching comparison
  let bestMatch = DISTANCE_COMPARISONS[0];
  for (const comparison of DISTANCE_COMPARISONS) {
    if (distanceKm >= comparison.km) {
      bestMatch = comparison;
    } else {
      break;
    }
  }

  return bestMatch;
}

/**
 * Calculate all travel statistics from check-in history
 * @param {boolean} forceRefresh - Force recalculation even if cached
 * @returns {Object} Calculated statistics
 */
export function calculateTravelStats(forceRefresh = false) {
  // Check cache first
  const cached = getCachedStats();
  if (!forceRefresh && cached) {
    return cached;
  }

  const state = getState();
  const checkinHistory = state.checkinHistory || [];
  const spots = state.spots || [];

  // Initialize stats
  const stats = {
    totalDistance: 0,
    totalWaitTime: 0,
    totalRides: checkinHistory.length,
    countriesVisited: new Set(),
    spotsUsed: new Set(),
    checkinsByMonth: {},
    checkinsByDayOfWeek: {},
    spotUsageCount: {},
    lastUpdated: Date.now(),
  };

  // Process each check-in
  for (const checkin of checkinHistory) {
    // Get spot info
    const spot = spots.find(s => s.id === checkin.spotId) || checkin.spot;

    if (spot) {
      // Track countries
      if (spot.country) {
        stats.countriesVisited.add(spot.country);
      }

      // Track spots used
      stats.spotsUsed.add(spot.id);

      // Track spot usage frequency
      stats.spotUsageCount[spot.id] = (stats.spotUsageCount[spot.id] || 0) + 1;

      // Add distance if available (estimate from spot data)
      if (checkin.distance) {
        stats.totalDistance += checkin.distance;
      } else if (spot.estimatedDistance) {
        stats.totalDistance += spot.estimatedDistance;
      }
    }

    // Add wait time
    const waitTime = getWaitTimeMinutes(checkin.waitTime);
    if (waitTime > 0) {
      stats.totalWaitTime += waitTime;
    }

    // Track by month
    if (checkin.timestamp) {
      const date = new Date(checkin.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayOfWeek = date.getDay();

      if (!stats.checkinsByMonth[monthKey]) {
        stats.checkinsByMonth[monthKey] = { count: 0, distance: 0 };
      }
      stats.checkinsByMonth[monthKey].count++;
      if (checkin.distance) {
        stats.checkinsByMonth[monthKey].distance += checkin.distance;
      }

      // Track by day of week
      stats.checkinsByDayOfWeek[dayOfWeek] = (stats.checkinsByDayOfWeek[dayOfWeek] || 0) + 1;
    }
  }

  // Also include state-level stats if no history
  if (checkinHistory.length === 0) {
    stats.totalDistance = state.totalDistance || 0;
    stats.totalWaitTime = state.totalWaitTime || 0;
    stats.totalRides = state.checkins || 0;
    stats.countriesVisited = new Set(state.visitedCountries || []);
    stats.spotsUsed = new Set();
  }

  // Calculate derived stats
  const calculatedStats = {
    totalDistanceKm: Math.round(stats.totalDistance / 1000),
    totalWaitTimeMinutes: stats.totalWaitTime,
    avgWaitTimeMinutes: stats.totalRides > 0
      ? Math.round(stats.totalWaitTime / stats.totalRides)
      : 0,
    countriesCount: stats.countriesVisited.size || (state.visitedCountries?.length || 0),
    countries: Array.from(stats.countriesVisited),
    spotsUsedCount: stats.spotsUsed.size || state.checkins || 0,
    totalRides: stats.totalRides || state.checkins || 0,
    bestMonth: getBestMonth(stats.checkinsByMonth),
    favoriteDay: getFavoriteDay(stats.checkinsByDayOfWeek),
    mostUsedSpot: getMostUsedSpot(stats.spotUsageCount, spots),
    distanceComparison: getDistanceComparison(Math.round(stats.totalDistance / 1000)),
    lastUpdated: stats.lastUpdated,
  };

  // Cache the results
  cacheStats(calculatedStats);

  return calculatedStats;
}

/**
 * Convert wait time category to minutes
 */
function getWaitTimeMinutes(waitTimeCategory) {
  const waitTimeMap = {
    0: 3,   // < 5 min -> avg 3
    1: 10,  // 5-15 min -> avg 10
    2: 22,  // 15-30 min -> avg 22
    3: 45,  // > 30 min -> avg 45
  };
  return waitTimeMap[waitTimeCategory] || 0;
}

/**
 * Get the best month (most km traveled)
 */
function getBestMonth(checkinsByMonth) {
  let bestMonth = null;
  let bestDistance = 0;
  let bestCount = 0;

  for (const [month, data] of Object.entries(checkinsByMonth)) {
    if (data.distance > bestDistance || (data.distance === bestDistance && data.count > bestCount)) {
      bestMonth = month;
      bestDistance = data.distance;
      bestCount = data.count;
    }
  }

  if (!bestMonth) return null;

  const [year, monthNum] = bestMonth.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    month: monthNames[parseInt(monthNum) - 1],
    year,
    distance: Math.round(bestDistance / 1000),
    count: bestCount,
  };
}

/**
 * Get the favorite day of week
 */
function getFavoriteDay(checkinsByDayOfWeek) {
  let favoriteDay = null;
  let maxCheckins = 0;

  for (const [day, count] of Object.entries(checkinsByDayOfWeek)) {
    if (count > maxCheckins) {
      favoriteDay = parseInt(day);
      maxCheckins = count;
    }
  }

  if (favoriteDay === null) return null;

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayEmojis = ['☀️', '🌅', '🚗', '🌤️', '⛅', '🎉', '🌈'];

  return {
    name: dayNames[favoriteDay],
    emoji: dayEmojis[favoriteDay],
    count: maxCheckins,
  };
}

/**
 * Get the most used spot
 */
function getMostUsedSpot(spotUsageCount, spots) {
  let mostUsedId = null;
  let maxUsage = 0;

  for (const [spotId, count] of Object.entries(spotUsageCount)) {
    if (count > maxUsage) {
      mostUsedId = parseInt(spotId);
      maxUsage = count;
    }
  }

  if (!mostUsedId || maxUsage === 0) return null;

  const spot = spots.find(s => s.id === mostUsedId);

  return {
    id: mostUsedId,
    name: spot?.from || 'Spot inconnu',
    destination: spot?.to || '',
    count: maxUsage,
    country: spot?.country,
  };
}

/**
 * Get cached stats
 */
function getCachedStats() {
  try {
    const cached = Storage.get(STATS_CACHE_KEY);
    if (cached && Date.now() - cached.lastUpdated < CACHE_TTL) {
      return cached;
    }
  } catch (e) {
    console.warn('Failed to read stats cache:', e);
  }
  return null;
}

/**
 * Cache stats
 */
function cacheStats(stats) {
  try {
    Storage.set(STATS_CACHE_KEY, stats);
  } catch (e) {
    console.warn('Failed to cache stats:', e);
  }
}

/**
 * Record a check-in with distance
 * @param {Object} spot - The spot being checked in
 * @param {Object} checkinData - Additional check-in data
 */
export function recordCheckinWithStats(spot, checkinData = {}) {
  const state = getState();
  const checkinHistory = state.checkinHistory || [];

  // Estimate distance (if not provided, use spot avgWaitTime as proxy for typical trip length)
  // Rough estimate: 1 minute wait = ~5km trip potential
  const estimatedDistance = checkinData.distance || (spot.avgWaitTime || 20) * 5 * 1000; // in meters

  const checkin = {
    spotId: spot.id,
    spot: {
      id: spot.id,
      from: spot.from,
      to: spot.to,
      country: spot.country,
      estimatedDistance,
    },
    waitTime: checkinData.waitTime,
    distance: estimatedDistance,
    timestamp: new Date().toISOString(),
    ...checkinData,
  };

  // Add to history
  const newHistory = [...checkinHistory, checkin];

  // Update state
  setState({
    checkinHistory: newHistory,
    totalDistance: (state.totalDistance || 0) + estimatedDistance,
    totalWaitTime: (state.totalWaitTime || 0) + getWaitTimeMinutes(checkinData.waitTime),
  });

  // Invalidate cache
  Storage.remove(STATS_CACHE_KEY);

  // Track country visit
  if (spot.country) {
    const visited = state.visitedCountries || [];
    if (!visited.includes(spot.country)) {
      setState({
        visitedCountries: [...visited, spot.country],
      });
    }
  }

  return checkin;
}

/**
 * Format duration in minutes to human readable
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted duration
 */
export function formatWaitDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format distance with appropriate unit
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
export function formatDistanceKm(km) {
  if (!km || km <= 0) return '0 km';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
}

/**
 * Get country flag emoji
 * @param {string} countryCode - ISO country code
 * @returns {string} Flag emoji
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);

  return String.fromCodePoint(...codePoints);
}

/**
 * Get progression data for mini chart
 * @param {number} months - Number of months to look back
 * @returns {Array} Monthly progression data
 */
export function getProgressionData(months = 6) {
  const state = getState();
  const checkinHistory = state.checkinHistory || [];

  const now = new Date();
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

    // Count check-ins for this month
    const monthCheckins = checkinHistory.filter(c => {
      if (!c.timestamp) return false;
      const checkinDate = new Date(c.timestamp);
      return checkinDate.getFullYear() === date.getFullYear() &&
             checkinDate.getMonth() === date.getMonth();
    });

    // Calculate distance for this month
    const monthDistance = monthCheckins.reduce((sum, c) => sum + (c.distance || 0), 0);

    data.push({
      month: monthName,
      monthKey,
      checkins: monthCheckins.length,
      distance: Math.round(monthDistance / 1000),
    });
  }

  return data;
}

export default {
  calculateTravelStats,
  recordCheckinWithStats,
  getDistanceComparison,
  formatWaitDuration,
  formatDistanceKm,
  getCountryFlag,
  getProgressionData,
};
