/**
 * Spot of the Day Service
 * Selects and manages the daily featured spot
 */

import { Storage } from '../utils/storage.js'
import { sampleSpots } from '../data/spots.js'

const STORAGE_KEY = 'spotOfTheDay'

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Calculate a spot's score for selection
 * Higher score = more likely to be selected
 */
function calculateSpotScore(spot, previousSpotIds = []) {
  let score = 0

  // Rating factor (0-5 stars, weighted heavily)
  if (spot.globalRating && spot.globalRating > 4) {
    score += (spot.globalRating - 4) * 50 // Up to 50 points for rating above 4
  }

  // Recent activity (check-ins count)
  if (spot.checkins) {
    score += Math.min(spot.checkins / 10, 30) // Up to 30 points for check-ins
  }

  // Recent usage bonus
  if (spot.lastUsed) {
    const lastUsedDate = new Date(spot.lastUsed)
    const daysSinceUsed = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUsed < 7) {
      score += 20 // Bonus for recently used spots
    } else if (daysSinceUsed < 30) {
      score += 10
    }
  }

  // Reviews count bonus
  if (spot.totalReviews) {
    score += Math.min(spot.totalReviews / 5, 20) // Up to 20 points for reviews
  }

  // Verified spot bonus
  if (spot.verified) {
    score += 15
  }

  // Photo availability bonus
  if (spot.photoUrl) {
    score += 10
  }

  // Penalty if it was recently featured (rotation logic)
  if (previousSpotIds.includes(spot.id)) {
    score -= 100 // Strong penalty to avoid repetition
  }

  // Add some randomness to prevent always selecting the same top spots
  score += Math.random() * 15

  return score
}

/**
 * Select the best spot for today
 */
function selectSpotOfTheDay(spots, previousSpotIds = []) {
  // Filter spots with rating > 4 stars
  const eligibleSpots = spots.filter(spot =>
    spot.globalRating && spot.globalRating > 4
  )

  if (eligibleSpots.length === 0) {
    // Fallback to all spots if none meet the rating criteria
    return spots.length > 0 ? spots[0] : null
  }

  // Calculate scores for all eligible spots
  const spotsWithScores = eligibleSpots.map(spot => ({
    spot,
    score: calculateSpotScore(spot, previousSpotIds)
  }))

  // Sort by score (descending) and pick the best one
  spotsWithScores.sort((a, b) => b.score - a.score)

  return spotsWithScores[0]?.spot || null
}

/**
 * Get the spot of the day
 * Returns cached spot if still valid (same day), otherwise selects a new one
 */
export function getSpotOfTheDay(spots = sampleSpots) {
  const today = getTodayString()
  const cached = Storage.get(STORAGE_KEY)

  // Check if we have a valid cached spot for today
  if (cached && cached.date === today && cached.spotId) {
    const cachedSpot = spots.find(s => s.id === cached.spotId)
    if (cachedSpot) {
      return {
        spot: cachedSpot,
        isNew: false,
        previousSpotIds: cached.previousSpotIds || []
      }
    }
  }

  // Get previously featured spot IDs (last 7 days)
  const previousSpotIds = cached?.previousSpotIds || []

  // Select a new spot
  const selectedSpot = selectSpotOfTheDay(spots, previousSpotIds)

  if (selectedSpot) {
    // Update previous spot IDs (keep last 7)
    const newPreviousSpotIds = [selectedSpot.id, ...previousSpotIds].slice(0, 7)

    // Save to storage
    Storage.set(STORAGE_KEY, {
      date: today,
      spotId: selectedSpot.id,
      previousSpotIds: newPreviousSpotIds,
      selectedAt: Date.now()
    })

    return {
      spot: selectedSpot,
      isNew: true,
      previousSpotIds: newPreviousSpotIds
    }
  }

  return null
}

/**
 * Force refresh the spot of the day (for testing/admin purposes)
 */
export function refreshSpotOfTheDay(spots = sampleSpots) {
  const today = getTodayString()
  const cached = Storage.get(STORAGE_KEY)
  const previousSpotIds = cached?.previousSpotIds || []

  // Add current spot to previous list if exists
  if (cached?.spotId) {
    previousSpotIds.unshift(cached.spotId)
  }

  // Select a new spot
  const selectedSpot = selectSpotOfTheDay(spots, previousSpotIds)

  if (selectedSpot) {
    const newPreviousSpotIds = [selectedSpot.id, ...previousSpotIds].slice(0, 7)

    Storage.set(STORAGE_KEY, {
      date: today,
      spotId: selectedSpot.id,
      previousSpotIds: newPreviousSpotIds,
      selectedAt: Date.now()
    })

    return {
      spot: selectedSpot,
      isNew: true,
      previousSpotIds: newPreviousSpotIds
    }
  }

  return null
}

/**
 * Check if the spot of the day should be refreshed (new day)
 */
export function shouldRefreshSpotOfTheDay() {
  const today = getTodayString()
  const cached = Storage.get(STORAGE_KEY)
  return !cached || cached.date !== today
}

/**
 * Get time until next spot of the day refresh (midnight)
 */
export function getTimeUntilNextSpot() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}min`
  }
}

export default {
  getSpotOfTheDay,
  refreshSpotOfTheDay,
  shouldRefreshSpotOfTheDay,
  getTimeUntilNextSpot
}
