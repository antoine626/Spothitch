/**
 * Recommended Hours Service
 * Provides recommended hitchhiking hours based on check-in data and wait times
 */

import { getState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';

// Storage key for hours data
const HOURS_DATA_KEY = 'recommended_hours_data';

// Hour labels for display
const HOUR_LABELS = [
  '00h', '01h', '02h', '03h', '04h', '05h',
  '06h', '07h', '08h', '09h', '10h', '11h',
  '12h', '13h', '14h', '15h', '16h', '17h',
  '18h', '19h', '20h', '21h', '22h', '23h',
];

// Time period definitions
const TIME_PERIODS = {
  morning: { start: 6, end: 11, label: 'Matin', emoji: '🌅' },
  afternoon: { start: 12, end: 17, label: 'Apres-midi', emoji: '☀️' },
  evening: { start: 18, end: 21, label: 'Soir', emoji: '🌆' },
  night: { start: 22, end: 5, label: 'Nuit', emoji: '🌙' },
};

// Wait time categories to minutes mapping
const WAIT_TIME_MINUTES = {
  0: 3,   // < 5 min -> avg 3
  1: 10,  // 5-15 min -> avg 10
  2: 22,  // 15-30 min -> avg 22
  3: 45,  // > 30 min -> avg 45
};

/**
 * Initialize hours data structure for a spot
 * @returns {Object} Empty hours data structure
 */
function createEmptyHoursData() {
  const data = {};
  for (let hour = 0; hour < 24; hour++) {
    data[hour] = {
      checkins: 0,
      totalWaitTime: 0,
      avgWaitTime: 0,
      successCount: 0,  // checkins with wait < 15 min
    };
  }
  return data;
}

/**
 * Get hours data from storage
 * @returns {Object} Hours data by spotId
 */
function getHoursDataFromStorage() {
  return Storage.get(HOURS_DATA_KEY) || {};
}

/**
 * Save hours data to storage
 * @param {Object} data - Hours data to save
 */
function saveHoursDataToStorage(data) {
  Storage.set(HOURS_DATA_KEY, data);
}

/**
 * Record a check-in time for a spot
 * @param {string|number} spotId - The spot ID
 * @param {number} hour - Hour of check-in (0-23)
 * @param {number} waitTimeCategory - Wait time category (0-3)
 * @returns {Object} Updated hour data for the spot
 */
export function recordCheckinTime(spotId, hour, waitTimeCategory = null) {
  if (spotId === undefined || spotId === null) {
    console.warn('[RecommendedHours] spotId is required');
    return null;
  }

  // Validate and normalize hour
  const normalizedHour = normalizeHour(hour);
  if (normalizedHour === null) {
    console.warn('[RecommendedHours] Invalid hour:', hour);
    return null;
  }

  const allData = getHoursDataFromStorage();
  const spotIdStr = String(spotId);

  // Initialize spot data if not exists
  if (!allData[spotIdStr]) {
    allData[spotIdStr] = createEmptyHoursData();
  }

  const hourData = allData[spotIdStr][normalizedHour];

  // Increment check-in count
  hourData.checkins++;

  // Add wait time if provided
  if (waitTimeCategory !== null && WAIT_TIME_MINUTES[waitTimeCategory] !== undefined) {
    const waitMinutes = WAIT_TIME_MINUTES[waitTimeCategory];
    hourData.totalWaitTime += waitMinutes;
    hourData.avgWaitTime = Math.round(hourData.totalWaitTime / hourData.checkins);

    // Track success (quick pickup)
    if (waitMinutes <= 15) {
      hourData.successCount++;
    }
  }

  // Save updated data
  saveHoursDataToStorage(allData);

  return { ...hourData, hour: normalizedHour };
}

/**
 * Normalize hour to 0-23 range
 * @param {number|string} hour - Hour value
 * @returns {number|null} Normalized hour or null if invalid
 */
function normalizeHour(hour) {
  const numHour = typeof hour === 'string' ? parseInt(hour, 10) : hour;

  if (isNaN(numHour) || numHour < 0 || numHour > 23) {
    return null;
  }

  return Math.floor(numHour);
}

/**
 * Get recommended hours for a spot
 * @param {string|number} spotId - The spot ID
 * @returns {Object} Recommended hours data with rankings
 */
export function getRecommendedHours(spotId) {
  if (spotId === undefined || spotId === null) {
    return {
      spotId: null,
      hours: [],
      bestPeriod: null,
      hasData: false,
      totalCheckins: 0,
    };
  }

  const spotIdStr = String(spotId);
  const allData = getHoursDataFromStorage();
  const spotData = allData[spotIdStr];

  if (!spotData) {
    return {
      spotId: spotIdStr,
      hours: HOUR_LABELS.map((label, hour) => ({
        hour,
        label,
        checkins: 0,
        avgWaitTime: 0,
        score: 0,
        rating: 'unknown',
      })),
      bestPeriod: null,
      hasData: false,
      totalCheckins: 0,
    };
  }

  // Calculate scores and rankings for each hour
  const hours = [];
  let totalCheckins = 0;
  let maxCheckins = 0;

  // First pass: get totals and max
  for (let hour = 0; hour < 24; hour++) {
    const data = spotData[hour] || { checkins: 0, avgWaitTime: 0, successCount: 0 };
    totalCheckins += data.checkins;
    maxCheckins = Math.max(maxCheckins, data.checkins);
  }

  // Second pass: calculate scores
  for (let hour = 0; hour < 24; hour++) {
    const data = spotData[hour] || { checkins: 0, avgWaitTime: 0, successCount: 0 };

    // Score based on:
    // - Check-in frequency (popularity)
    // - Low wait time
    // - Success rate
    let score = 0;
    if (data.checkins > 0) {
      const popularityScore = (data.checkins / (maxCheckins || 1)) * 40;
      const waitScore = Math.max(0, 40 - data.avgWaitTime);
      const successRate = data.checkins > 0 ? (data.successCount / data.checkins) : 0;
      const successScore = successRate * 20;

      score = Math.round(popularityScore + waitScore + successScore);
    }

    hours.push({
      hour,
      label: HOUR_LABELS[hour],
      checkins: data.checkins,
      avgWaitTime: data.avgWaitTime,
      successCount: data.successCount,
      score: Math.min(100, Math.max(0, score)),
      rating: getRatingForScore(score),
    });
  }

  // Determine best period
  const bestPeriod = calculateBestPeriod(hours);

  return {
    spotId: spotIdStr,
    hours,
    bestPeriod,
    hasData: totalCheckins > 0,
    totalCheckins,
  };
}

/**
 * Get rating label based on score
 * @param {number} score - Score 0-100
 * @returns {string} Rating label
 */
function getRatingForScore(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  if (score > 0) return 'poor';
  return 'unknown';
}

/**
 * Calculate the best time period for hitchhiking
 * @param {Array} hours - Array of hour data
 * @returns {Object|null} Best period info
 */
function calculateBestPeriod(hours) {
  const periodScores = {};

  for (const [periodName, period] of Object.entries(TIME_PERIODS)) {
    let totalScore = 0;
    let count = 0;

    for (let h = period.start; h !== period.end + 1; h = (h + 1) % 24) {
      const hourData = hours[h];
      if (hourData) {
        totalScore += hourData.score;
        count++;
      }
      // Handle wrap-around for night period
      if (h === 23 && period.start > period.end) {
        for (let n = 0; n <= period.end; n++) {
          const nightData = hours[n];
          if (nightData) {
            totalScore += nightData.score;
            count++;
          }
        }
        break;
      }
    }

    periodScores[periodName] = count > 0 ? totalScore / count : 0;
  }

  // Find best period
  let bestPeriodName = null;
  let bestScore = 0;

  for (const [name, score] of Object.entries(periodScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestPeriodName = name;
    }
  }

  if (!bestPeriodName || bestScore === 0) return null;

  const period = TIME_PERIODS[bestPeriodName];
  return {
    name: bestPeriodName,
    label: period.label,
    emoji: period.emoji,
    startHour: period.start,
    endHour: period.end,
    avgScore: Math.round(bestScore),
  };
}

/**
 * Get the best hours for a spot (top N hours)
 * @param {string|number} spotId - The spot ID
 * @param {number} limit - Number of top hours to return
 * @returns {Array} Array of best hours sorted by score
 */
export function getBestHours(spotId, limit = 3) {
  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return [];
  }

  return [...recommended.hours]
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get the worst hours for a spot (bottom N hours with data)
 * @param {string|number} spotId - The spot ID
 * @param {number} limit - Number of worst hours to return
 * @returns {Array} Array of worst hours sorted by score ascending
 */
export function getWorstHours(spotId, limit = 3) {
  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return [];
  }

  return [...recommended.hours]
    .filter(h => h.checkins > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Get hours data aggregated by time period
 * @param {string|number} spotId - The spot ID
 * @returns {Object} Period-based data
 */
export function getHoursByPeriod(spotId) {
  const recommended = getRecommendedHours(spotId);

  const periods = {};
  for (const [periodName, period] of Object.entries(TIME_PERIODS)) {
    const periodHours = [];

    // Collect hours for this period
    if (period.start <= period.end) {
      for (let h = period.start; h <= period.end; h++) {
        periodHours.push(recommended.hours[h]);
      }
    } else {
      // Night period wraps around
      for (let h = period.start; h <= 23; h++) {
        periodHours.push(recommended.hours[h]);
      }
      for (let h = 0; h <= period.end; h++) {
        periodHours.push(recommended.hours[h]);
      }
    }

    const totalCheckins = periodHours.reduce((sum, h) => sum + h.checkins, 0);
    const avgScore = periodHours.length > 0
      ? Math.round(periodHours.reduce((sum, h) => sum + h.score, 0) / periodHours.length)
      : 0;

    periods[periodName] = {
      ...period,
      hours: periodHours,
      totalCheckins,
      avgScore,
      rating: getRatingForScore(avgScore),
    };
  }

  return periods;
}

/**
 * Render a visual chart of recommended hours
 * @param {string|number} spotId - The spot ID
 * @param {Object} options - Rendering options
 * @returns {string} HTML string for the chart
 */
export function renderHoursChart(spotId, options = {}) {
  const {
    showLabels = true,
    height = 120,
    barWidth = 12,
    showLegend = true,
    compact = false,
  } = options;

  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return renderEmptyChart();
  }

  const chartHeight = compact ? 80 : height;
  const chartBarWidth = compact ? 8 : barWidth;

  // Find max score for scaling
  const maxScore = Math.max(...recommended.hours.map(h => h.score), 1);

  // Generate bars
  const bars = recommended.hours.map((hourData, index) => {
    const barHeight = (hourData.score / maxScore) * (chartHeight - 20);
    const colorClass = getBarColorClass(hourData.rating);
    const showLabel = showLabels && (index % (compact ? 6 : 3) === 0);

    return `
      <div class="flex flex-col items-center" style="width: ${chartBarWidth}px;">
        <div
          class="w-full rounded-t ${colorClass} transition-all duration-300 hover:opacity-80"
          style="height: ${Math.max(2, barHeight)}px;"
          title="${hourData.label}: ${hourData.checkins} check-ins, attente moy. ${hourData.avgWaitTime} min"
          aria-label="Heure ${hourData.hour}: score ${hourData.score}"
        ></div>
        ${showLabel ? `<span class="text-[8px] text-slate-500 mt-1">${hourData.label}</span>` : ''}
      </div>
    `;
  }).join('');

  // Best hours summary
  const bestHours = getBestHours(spotId, 3);
  const bestHoursText = bestHours.length > 0
    ? bestHours.map(h => h.label).join(', ')
    : 'Pas assez de donnees';

  // Render chart
  return `
    <div class="recommended-hours-chart bg-dark-card rounded-xl p-4" role="figure" aria-label="Horaires recommandes pour ce spot">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-white flex items-center gap-2">
          <span class="text-lg">🕐</span>
          Horaires recommandes
        </h4>
        ${recommended.bestPeriod ? `
          <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            ${recommended.bestPeriod.emoji} ${recommended.bestPeriod.label}
          </span>
        ` : ''}
      </div>

      <div class="flex items-end justify-between gap-[2px]" style="height: ${chartHeight}px;">
        ${bars}
      </div>

      ${showLegend ? renderLegend() : ''}

      <div class="mt-3 pt-3 border-t border-slate-700">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Meilleurs creneaux :</span>
          <span class="text-green-400 font-medium">${bestHoursText}</span>
        </div>
        <div class="flex items-center justify-between text-xs mt-1">
          <span class="text-slate-400">Total check-ins :</span>
          <span class="text-slate-300">${recommended.totalCheckins}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render empty chart placeholder
 * @returns {string} HTML string
 */
function renderEmptyChart() {
  return `
    <div class="recommended-hours-chart bg-dark-card rounded-xl p-4" role="figure" aria-label="Horaires recommandes - pas de donnees">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">🕐</span>
        <h4 class="text-sm font-medium text-white">Horaires recommandes</h4>
      </div>

      <div class="flex flex-col items-center justify-center py-8 text-center">
        <span class="text-4xl mb-2">📊</span>
        <p class="text-sm text-slate-400">Pas encore de donnees</p>
        <p class="text-xs text-slate-500 mt-1">Les horaires recommandes apparaitront apres les premiers check-ins</p>
      </div>
    </div>
  `;
}

/**
 * Get CSS color class for bar based on rating
 * @param {string} rating - Rating label
 * @returns {string} Tailwind CSS class
 */
function getBarColorClass(rating) {
  switch (rating) {
    case 'excellent':
      return 'bg-green-500';
    case 'good':
      return 'bg-green-400';
    case 'average':
      return 'bg-yellow-500';
    case 'poor':
      return 'bg-red-400';
    default:
      return 'bg-slate-600';
  }
}

/**
 * Render legend for the chart
 * @returns {string} HTML string
 */
function renderLegend() {
  return `
    <div class="flex items-center justify-center gap-4 mt-3 text-[10px]">
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded bg-green-500"></div>
        <span class="text-slate-400">Excellent</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded bg-yellow-500"></div>
        <span class="text-slate-400">Moyen</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded bg-red-400"></div>
        <span class="text-slate-400">Deconseille</span>
      </div>
    </div>
  `;
}

/**
 * Render a compact hours summary for spot cards
 * @param {string|number} spotId - The spot ID
 * @returns {string} HTML string
 */
export function renderCompactHoursSummary(spotId) {
  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return '';
  }

  const bestHours = getBestHours(spotId, 2);

  if (bestHours.length === 0) {
    return '';
  }

  return `
    <div class="flex items-center gap-1 text-xs text-slate-400">
      <span class="text-green-400">🕐</span>
      <span>Ideal: ${bestHours.map(h => h.label).join('-')}</span>
    </div>
  `;
}

/**
 * Get peak hours (hours with most check-ins)
 * @param {string|number} spotId - The spot ID
 * @param {number} limit - Number of hours to return
 * @returns {Array} Peak hours sorted by check-in count
 */
export function getPeakHours(spotId, limit = 3) {
  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return [];
  }

  return [...recommended.hours]
    .filter(h => h.checkins > 0)
    .sort((a, b) => b.checkins - a.checkins)
    .slice(0, limit);
}

/**
 * Get average wait time for a specific hour
 * @param {string|number} spotId - The spot ID
 * @param {number} hour - Hour (0-23)
 * @returns {number} Average wait time in minutes
 */
export function getAvgWaitTimeForHour(spotId, hour) {
  const recommended = getRecommendedHours(spotId);
  const normalizedHour = normalizeHour(hour);

  if (normalizedHour === null || !recommended.hasData) {
    return 0;
  }

  const hourData = recommended.hours[normalizedHour];
  return hourData ? hourData.avgWaitTime : 0;
}

/**
 * Bulk record check-ins from history
 * @param {Array} checkinHistory - Array of check-in records
 */
export function importCheckinHistory(checkinHistory) {
  if (!Array.isArray(checkinHistory)) {
    return { imported: 0, errors: 0 };
  }

  let imported = 0;
  let errors = 0;

  for (const checkin of checkinHistory) {
    try {
      if (checkin.spotId && checkin.timestamp) {
        const date = new Date(checkin.timestamp);
        const hour = date.getHours();
        recordCheckinTime(checkin.spotId, hour, checkin.waitTime);
        imported++;
      }
    } catch (e) {
      errors++;
    }
  }

  return { imported, errors };
}

/**
 * Clear all hours data (for testing/reset)
 */
export function clearAllHoursData() {
  Storage.remove(HOURS_DATA_KEY);
}

/**
 * Clear hours data for a specific spot
 * @param {string|number} spotId - The spot ID
 */
export function clearSpotHoursData(spotId) {
  if (spotId === undefined || spotId === null) return;

  const spotIdStr = String(spotId);
  const allData = getHoursDataFromStorage();

  if (allData[spotIdStr]) {
    delete allData[spotIdStr];
    saveHoursDataToStorage(allData);
  }
}

/**
 * Get time period constants
 * @returns {Object} Time periods definition
 */
export function getTimePeriods() {
  return { ...TIME_PERIODS };
}

/**
 * Get hour labels
 * @returns {Array} Array of hour labels
 */
export function getHourLabels() {
  return [...HOUR_LABELS];
}

/**
 * Check if a specific hour is recommended
 * @param {string|number} spotId - The spot ID
 * @param {number} hour - Hour to check (0-23)
 * @returns {boolean} Whether the hour is recommended
 */
export function isHourRecommended(spotId, hour) {
  const bestHours = getBestHours(spotId, 5);
  return bestHours.some(h => h.hour === normalizeHour(hour));
}

/**
 * Get current hour recommendation for spot
 * @param {string|number} spotId - The spot ID
 * @returns {Object} Current hour recommendation
 */
export function getCurrentHourRecommendation(spotId) {
  const currentHour = new Date().getHours();
  const recommended = getRecommendedHours(spotId);

  if (!recommended.hasData) {
    return {
      hour: currentHour,
      label: HOUR_LABELS[currentHour],
      isGoodTime: true, // Assume good if no data
      rating: 'unknown',
      message: 'Pas de donnees pour ce creneau',
    };
  }

  const hourData = recommended.hours[currentHour];
  const isGoodTime = hourData.score >= 50;

  let message;
  switch (hourData.rating) {
    case 'excellent':
      message = 'Excellent moment pour faire du stop !';
      break;
    case 'good':
      message = 'Bon creneau pour tenter sa chance';
      break;
    case 'average':
      message = 'Creneau moyen, soyez patient';
      break;
    case 'poor':
      message = 'Creneau peu favorable, attendez si possible';
      break;
    default:
      message = 'Pas assez de donnees pour ce creneau';
  }

  return {
    hour: currentHour,
    label: HOUR_LABELS[currentHour],
    isGoodTime,
    rating: hourData.rating,
    score: hourData.score,
    avgWaitTime: hourData.avgWaitTime,
    message,
  };
}

// Export default object with all functions
export default {
  recordCheckinTime,
  getRecommendedHours,
  getBestHours,
  getWorstHours,
  getHoursByPeriod,
  renderHoursChart,
  renderCompactHoursSummary,
  getPeakHours,
  getAvgWaitTimeForHour,
  importCheckinHistory,
  clearAllHoursData,
  clearSpotHoursData,
  getTimePeriods,
  getHourLabels,
  isHourRecommended,
  getCurrentHourRecommendation,
};
