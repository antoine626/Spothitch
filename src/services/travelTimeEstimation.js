/**
 * Travel Time Estimation Service
 * Estimates hitchhiking travel times with wait times, day/hour factors, and optimistic/pessimistic ranges
 */

import { getState } from '../stores/state.js';
import { sampleSpots } from '../data/spots.js';
import { getRoute } from './osrm.js';

// Average driving speed in km/h for different road types
const DRIVING_SPEEDS = {
  highway: 100,
  mainRoad: 70,
  localRoad: 50,
  default: 80,
};

// Wait time factors by time of day (multiplier)
const TIME_OF_DAY_FACTORS = {
  earlyMorning: { start: 5, end: 7, factor: 1.5, name: 'early_morning' }, // Less traffic
  rushHour: { start: 7, end: 9, factor: 0.7, name: 'rush_hour' }, // Good for catching commuters
  midMorning: { start: 9, end: 12, factor: 1.0, name: 'mid_morning' },
  lunchTime: { start: 12, end: 14, factor: 1.3, name: 'lunch_time' }, // Some stops for lunch
  afternoon: { start: 14, end: 17, factor: 1.0, name: 'afternoon' },
  eveningRush: { start: 17, end: 19, factor: 0.8, name: 'evening_rush' }, // Good for commuters
  evening: { start: 19, end: 22, factor: 1.8, name: 'evening' }, // Harder to get rides
  night: { start: 22, end: 5, factor: 3.0, name: 'night' }, // Very difficult
};

// Wait time factors by day of week (multiplier)
const DAY_OF_WEEK_FACTORS = {
  0: 1.5, // Sunday - less traffic
  1: 0.9, // Monday - good traffic
  2: 0.9, // Tuesday
  3: 0.9, // Wednesday
  4: 0.9, // Thursday
  5: 0.8, // Friday - best day, weekend travelers
  6: 1.2, // Saturday - less commuters
};

// Default wait times in minutes
const DEFAULT_WAIT_TIME = 30;
const MIN_WAIT_TIME = 5;
const MAX_WAIT_TIME = 120;

// Estimate variance factors
const OPTIMISTIC_FACTOR = 0.6;
const PESSIMISTIC_FACTOR = 1.8;

/**
 * Calculate Haversine distance between two points
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get spot data by ID
 * @param {number|string} spotId - Spot ID
 * @returns {Object|null} Spot data or null
 */
function getSpotById(spotId) {
  const state = getState();
  const spots = state.spots?.length > 0 ? state.spots : sampleSpots;
  return spots.find(s => s.id === spotId || s.id === Number(spotId)) || null;
}

/**
 * Get time of day factor based on hour
 * @param {number} hour - Hour (0-23)
 * @returns {Object} Factor info { factor, name }
 */
export function getTimeOfDayFactor(hour) {
  // Normalize hour to 0-23
  const normalizedHour = Math.floor(hour) % 24;

  for (const [, period] of Object.entries(TIME_OF_DAY_FACTORS)) {
    if (period.start <= period.end) {
      // Normal range (e.g., 7-9)
      if (normalizedHour >= period.start && normalizedHour < period.end) {
        return { factor: period.factor, name: period.name };
      }
    } else {
      // Wrapping range (e.g., 22-5)
      if (normalizedHour >= period.start || normalizedHour < period.end) {
        return { factor: period.factor, name: period.name };
      }
    }
  }

  return { factor: 1.0, name: 'default' };
}

/**
 * Get day of week factor
 * @param {number} dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns {number} Factor multiplier
 */
export function getDayOfWeekFactor(dayOfWeek) {
  const normalizedDay = Math.floor(dayOfWeek) % 7;
  return DAY_OF_WEEK_FACTORS[normalizedDay] ?? 1.0;
}

/**
 * Get average wait time for a spot
 * @param {number|string} spotId - Spot ID
 * @returns {number} Average wait time in minutes
 */
export function getAverageWaitTime(spotId) {
  if (spotId === undefined || spotId === null) {
    return DEFAULT_WAIT_TIME;
  }

  const spot = getSpotById(spotId);

  if (!spot) {
    return DEFAULT_WAIT_TIME;
  }

  // If spot has avgWaitTime, use it
  if (spot.avgWaitTime !== undefined && spot.avgWaitTime !== null) {
    return Math.max(MIN_WAIT_TIME, Math.min(MAX_WAIT_TIME, spot.avgWaitTime));
  }

  // Estimate based on rating (higher rating = lower wait time)
  if (spot.globalRating !== undefined) {
    // Scale: 5 stars = ~10min, 1 star = ~60min
    const waitTime = Math.round(70 - (spot.globalRating * 12));
    return Math.max(MIN_WAIT_TIME, Math.min(MAX_WAIT_TIME, waitTime));
  }

  return DEFAULT_WAIT_TIME;
}

/**
 * Adjust wait time based on time of day and day of week
 * @param {number} baseWaitTime - Base wait time in minutes
 * @param {Date|null} dateTime - Date/time for adjustment (null for no adjustment)
 * @returns {Object} Adjusted wait time with details
 */
export function adjustWaitTimeForDateTime(baseWaitTime, dateTime = null) {
  if (!dateTime || !(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
    return {
      adjustedWaitTime: baseWaitTime,
      timeOfDayFactor: 1.0,
      dayOfWeekFactor: 1.0,
      timeOfDayName: 'default',
    };
  }

  const hour = dateTime.getHours();
  const dayOfWeek = dateTime.getDay();

  const timeInfo = getTimeOfDayFactor(hour);
  const dayFactor = getDayOfWeekFactor(dayOfWeek);

  const combinedFactor = timeInfo.factor * dayFactor;
  const adjustedWaitTime = Math.round(baseWaitTime * combinedFactor);

  return {
    adjustedWaitTime: Math.max(MIN_WAIT_TIME, Math.min(MAX_WAIT_TIME * 2, adjustedWaitTime)),
    timeOfDayFactor: timeInfo.factor,
    dayOfWeekFactor: dayFactor,
    timeOfDayName: timeInfo.name,
    combinedFactor,
  };
}

/**
 * Estimate travel time between two points via hitchhiking
 * @param {Object} origin - Origin { lat, lng } or { coordinates: { lat, lng } }
 * @param {Object} destination - Destination { lat, lng } or { coordinates: { lat, lng } }
 * @param {Object} options - Options { dateTime, useOSRM, spotId }
 * @returns {Promise<Object>} Estimated travel time with optimistic/pessimistic range
 */
export async function estimateTravelTime(origin, destination, options = {}) {
  // Normalize coordinates
  const originCoords = origin.coordinates || origin;
  const destCoords = destination.coordinates || destination;

  // Validate inputs
  if (!originCoords || !destCoords) {
    throw new Error('Origin and destination coordinates required');
  }

  if (typeof originCoords.lat !== 'number' || typeof originCoords.lng !== 'number') {
    throw new Error('Invalid origin coordinates');
  }

  if (typeof destCoords.lat !== 'number' || typeof destCoords.lng !== 'number') {
    throw new Error('Invalid destination coordinates');
  }

  const { dateTime = null, useOSRM = false, spotId = null } = options;

  let distanceKm;
  let drivingDurationMinutes;

  if (useOSRM) {
    try {
      const route = await getRoute([
        { lat: originCoords.lat, lng: originCoords.lng },
        { lat: destCoords.lat, lng: destCoords.lng },
      ]);
      distanceKm = route.distance / 1000;
      drivingDurationMinutes = route.duration / 60;
    } catch (error) {
      // Fall back to Haversine if OSRM fails
      console.warn('OSRM failed, using Haversine:', error.message);
      distanceKm = haversineDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );
      // Estimate driving time: add 30% to account for road curves
      drivingDurationMinutes = (distanceKm / DRIVING_SPEEDS.default) * 60 * 1.3;
    }
  } else {
    // Use Haversine distance
    distanceKm = haversineDistance(
      originCoords.lat, originCoords.lng,
      destCoords.lat, destCoords.lng
    );
    // Estimate driving time: add 30% to account for road curves
    drivingDurationMinutes = (distanceKm / DRIVING_SPEEDS.default) * 60 * 1.3;
  }

  // Get wait time
  const baseWaitTime = getAverageWaitTime(spotId);
  const waitTimeInfo = adjustWaitTimeForDateTime(baseWaitTime, dateTime);

  // Calculate total estimated time
  const estimatedTotalMinutes = drivingDurationMinutes + waitTimeInfo.adjustedWaitTime;

  // Calculate optimistic/pessimistic ranges
  const optimisticMinutes = Math.round(
    drivingDurationMinutes + (waitTimeInfo.adjustedWaitTime * OPTIMISTIC_FACTOR)
  );
  const pessimisticMinutes = Math.round(
    drivingDurationMinutes * 1.2 + (waitTimeInfo.adjustedWaitTime * PESSIMISTIC_FACTOR)
  );

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    drivingDurationMinutes: Math.round(drivingDurationMinutes),
    waitTimeMinutes: waitTimeInfo.adjustedWaitTime,
    baseWaitTimeMinutes: baseWaitTime,
    estimatedTotalMinutes: Math.round(estimatedTotalMinutes),
    optimisticMinutes,
    pessimisticMinutes,
    timeOfDayFactor: waitTimeInfo.timeOfDayFactor,
    dayOfWeekFactor: waitTimeInfo.dayOfWeekFactor,
    timeOfDayName: waitTimeInfo.timeOfDayName,
    formatted: {
      driving: formatDuration(Math.round(drivingDurationMinutes)),
      waitTime: formatDuration(waitTimeInfo.adjustedWaitTime),
      total: formatDuration(Math.round(estimatedTotalMinutes)),
      optimistic: formatDuration(optimisticMinutes),
      pessimistic: formatDuration(pessimisticMinutes),
      range: `${formatDuration(optimisticMinutes)} - ${formatDuration(pessimisticMinutes)}`,
    },
  };
}

/**
 * Calculate total trip time for a route with multiple stops
 * @param {Array} route - Array of points { lat, lng, spotId? }
 * @param {Object} options - Options { dateTime, useOSRM }
 * @returns {Promise<Object>} Total trip time estimation
 */
export async function calculateTotalTripTime(route, options = {}) {
  if (!Array.isArray(route) || route.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  const { dateTime = null, useOSRM = false } = options;
  let currentDateTime = dateTime ? new Date(dateTime) : null;

  const legs = [];
  let totalDistanceKm = 0;
  let totalDrivingMinutes = 0;
  let totalWaitMinutes = 0;
  let totalOptimisticMinutes = 0;
  let totalPessimisticMinutes = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const origin = route[i];
    const destination = route[i + 1];

    const legEstimate = await estimateTravelTime(origin, destination, {
      dateTime: currentDateTime,
      useOSRM,
      spotId: origin.spotId || null,
    });

    legs.push({
      from: i,
      to: i + 1,
      ...legEstimate,
    });

    totalDistanceKm += legEstimate.distanceKm;
    totalDrivingMinutes += legEstimate.drivingDurationMinutes;
    totalWaitMinutes += legEstimate.waitTimeMinutes;
    totalOptimisticMinutes += legEstimate.optimisticMinutes;
    totalPessimisticMinutes += legEstimate.pessimisticMinutes;

    // Advance time for next leg calculation
    if (currentDateTime) {
      currentDateTime = new Date(currentDateTime.getTime() + legEstimate.estimatedTotalMinutes * 60000);
    }
  }

  const totalEstimatedMinutes = totalDrivingMinutes + totalWaitMinutes;

  return {
    legs,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDrivingMinutes: Math.round(totalDrivingMinutes),
    totalWaitMinutes: Math.round(totalWaitMinutes),
    totalEstimatedMinutes: Math.round(totalEstimatedMinutes),
    totalOptimisticMinutes: Math.round(totalOptimisticMinutes),
    totalPessimisticMinutes: Math.round(totalPessimisticMinutes),
    numberOfStops: route.length - 1,
    averageWaitPerStop: Math.round(totalWaitMinutes / (route.length - 1)),
    formatted: {
      totalDriving: formatDuration(Math.round(totalDrivingMinutes)),
      totalWait: formatDuration(Math.round(totalWaitMinutes)),
      total: formatDuration(Math.round(totalEstimatedMinutes)),
      optimistic: formatDuration(Math.round(totalOptimisticMinutes)),
      pessimistic: formatDuration(Math.round(totalPessimisticMinutes)),
      range: `${formatDuration(Math.round(totalOptimisticMinutes))} - ${formatDuration(Math.round(totalPessimisticMinutes))}`,
    },
    estimatedArrival: currentDateTime ? currentDateTime.toISOString() : null,
  };
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export function formatDuration(minutes) {
  if (minutes === undefined || minutes === null || isNaN(minutes)) {
    return '-- min';
  }

  const mins = Math.round(minutes);

  if (mins < 0) {
    return '0 min';
  }

  if (mins < 60) {
    return `${mins} min`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}j`;
    }
    return `${days}j ${remainingHours}h`;
  }

  if (remainingMins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMins}min`;
}

/**
 * Get wait time statistics for multiple spots
 * @param {Array<number|string>} spotIds - Array of spot IDs
 * @returns {Object} Wait time statistics
 */
export function getWaitTimeStats(spotIds) {
  if (!Array.isArray(spotIds) || spotIds.length === 0) {
    return {
      average: DEFAULT_WAIT_TIME,
      min: DEFAULT_WAIT_TIME,
      max: DEFAULT_WAIT_TIME,
      count: 0,
    };
  }

  const waitTimes = spotIds.map(id => getAverageWaitTime(id));

  return {
    average: Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length),
    min: Math.min(...waitTimes),
    max: Math.max(...waitTimes),
    count: waitTimes.length,
  };
}

/**
 * Get best time to hitchhike based on factors
 * @returns {Object} Best times info
 */
export function getBestHitchhikingTimes() {
  const times = [];

  for (const [key, period] of Object.entries(TIME_OF_DAY_FACTORS)) {
    times.push({
      period: key,
      name: period.name,
      startHour: period.start,
      endHour: period.end,
      factor: period.factor,
      recommendation: period.factor < 1 ? 'excellent' : period.factor <= 1.2 ? 'good' : period.factor <= 1.5 ? 'fair' : 'poor',
    });
  }

  // Sort by factor (lower = better)
  times.sort((a, b) => a.factor - b.factor);

  const days = Object.entries(DAY_OF_WEEK_FACTORS)
    .map(([day, factor]) => ({
      day: Number(day),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      factor,
      recommendation: factor < 1 ? 'excellent' : factor <= 1.2 ? 'good' : 'fair',
    }))
    .sort((a, b) => a.factor - b.factor);

  return {
    bestTimeOfDay: times[0],
    worstTimeOfDay: times[times.length - 1],
    bestDayOfWeek: days[0],
    worstDayOfWeek: days[days.length - 1],
    allTimes: times,
    allDays: days,
  };
}

/**
 * Estimate if a trip is feasible in daylight
 * @param {number} totalMinutes - Total trip minutes
 * @param {Date} startTime - Start time
 * @returns {Object} Daylight feasibility info
 */
export function checkDaylightFeasibility(totalMinutes, startTime) {
  if (!startTime || !(startTime instanceof Date) || isNaN(startTime.getTime())) {
    return {
      feasible: null,
      message: 'Start time required for daylight check',
    };
  }

  const startHour = startTime.getHours();
  const arrivalTime = new Date(startTime.getTime() + totalMinutes * 60000);
  const arrivalHour = arrivalTime.getHours();

  // Simple daylight check (6am - 9pm)
  const SUNRISE = 6;
  const SUNSET = 21;

  const startsInDaylight = startHour >= SUNRISE && startHour < SUNSET;
  const endsInDaylight = arrivalHour >= SUNRISE && arrivalHour < SUNSET;

  // Check if we need to travel through night
  const travelsThroughNight = !startsInDaylight || !endsInDaylight ||
    (totalMinutes > (SUNSET - startHour) * 60 && startHour < SUNSET);

  let message;
  let recommendation;

  if (startsInDaylight && endsInDaylight && !travelsThroughNight) {
    message = 'Trip can be completed in daylight';
    recommendation = 'good';
  } else if (startsInDaylight && !endsInDaylight) {
    message = 'Trip will continue after dark - consider finding accommodation';
    recommendation = 'caution';
  } else if (!startsInDaylight) {
    message = 'Starting before sunrise - wait times may be longer';
    recommendation = 'caution';
  } else {
    message = 'Trip includes significant nighttime travel - not recommended';
    recommendation: 'poor';
  }

  return {
    feasible: startsInDaylight && endsInDaylight && !travelsThroughNight,
    startsInDaylight,
    endsInDaylight,
    travelsThroughNight,
    startTime: startTime.toISOString(),
    estimatedArrival: arrivalTime.toISOString(),
    message,
    recommendation,
  };
}

/**
 * Get estimated trip difficulty based on distance and wait times
 * @param {number} distanceKm - Distance in km
 * @param {number} averageWaitTime - Average wait time in minutes
 * @returns {Object} Difficulty assessment
 */
export function getTripDifficulty(distanceKm, averageWaitTime) {
  let distanceScore;
  if (distanceKm < 50) distanceScore = 1;
  else if (distanceKm < 150) distanceScore = 2;
  else if (distanceKm < 300) distanceScore = 3;
  else if (distanceKm < 500) distanceScore = 4;
  else distanceScore = 5;

  let waitScore;
  if (averageWaitTime < 15) waitScore = 1;
  else if (averageWaitTime < 30) waitScore = 2;
  else if (averageWaitTime < 45) waitScore = 3;
  else if (averageWaitTime < 60) waitScore = 4;
  else waitScore = 5;

  const totalScore = (distanceScore + waitScore) / 2;

  let difficulty;
  let emoji;
  if (totalScore <= 1.5) {
    difficulty = 'easy';
    emoji = '😊';
  } else if (totalScore <= 2.5) {
    difficulty = 'moderate';
    emoji = '🙂';
  } else if (totalScore <= 3.5) {
    difficulty = 'challenging';
    emoji = '😅';
  } else if (totalScore <= 4.5) {
    difficulty = 'difficult';
    emoji = '😰';
  } else {
    difficulty = 'extreme';
    emoji = '😱';
  }

  return {
    difficulty,
    emoji,
    score: Math.round(totalScore * 10) / 10,
    distanceScore,
    waitScore,
    tips: getDifficultyTips(difficulty),
  };
}

/**
 * Get tips based on difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Array<string>} Tips
 */
function getDifficultyTips(difficulty) {
  const tips = {
    easy: [
      'Short trip, should be quick!',
      'Perfect for beginners',
    ],
    moderate: [
      'Allow some buffer time',
      'Bring water and snacks',
    ],
    challenging: [
      'Start early in the morning',
      'Have a backup plan',
      'Consider splitting into multiple days',
    ],
    difficult: [
      'Experienced hitchhikers only',
      'Plan accommodation along the way',
      'Tell someone your route',
    ],
    extreme: [
      'Not recommended in one day',
      'Split into multiple legs',
      'Consider alternative transport for part of the journey',
    ],
  };

  return tips[difficulty] || tips.moderate;
}

export default {
  estimateTravelTime,
  getAverageWaitTime,
  calculateTotalTripTime,
  formatDuration,
  getTimeOfDayFactor,
  getDayOfWeekFactor,
  adjustWaitTimeForDateTime,
  getWaitTimeStats,
  getBestHitchhikingTimes,
  checkDaylightFeasibility,
  getTripDifficulty,
};
