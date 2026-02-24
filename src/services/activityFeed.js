import { t } from '../i18n/index.js'
import { Storage } from '../utils/storage.js'
import { getState } from '../stores/state.js'

const STORAGE_KEY = 'spothitch_activity_feed'
const MAX_ACTIVITIES = 100

/**
 * Get activity feed items with optional filtering
 * @param {string} filter - Filter type: 'all', 'friends', 'events', 'nearby'
 * @returns {Array} Filtered activity items
 */
export function getActivityFeed(filter = 'all') {
  let activities = Storage.get(STORAGE_KEY)
  if (!activities || activities.length === 0) {
    activities = generateSampleActivities()
  }
  const state = getState()

  if (filter === 'all') {
    return activities
  }

  if (filter === 'friends') {
    const friendIds = state.friends?.map(f => f.id) || []
    return activities.filter(a => friendIds.includes(a.userId))
  }

  if (filter === 'events') {
    return activities.filter(a =>
      a.type === 'event_created' || a.type === 'event_joined'
    )
  }

  if (filter === 'nearby') {
    const userLocation = state.userLocation
    if (!userLocation) return []

    return activities.filter(a => {
      if (!a.location) return false
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        a.location.lat,
        a.location.lng
      )
      return distance < 50 // Within 50km
    })
  }

  return activities
}

/**
 * Add a new activity to the feed
 * @param {Object} activity - Activity object
 */
export function addActivity(activity) {
  const activities = Storage.get(STORAGE_KEY) || []

  const newActivity = {
    id: `activity_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    timestamp: Date.now(),
    ...activity
  }

  // Add to beginning of array (newest first)
  activities.unshift(newActivity)

  // Keep only max items
  if (activities.length > MAX_ACTIVITIES) {
    activities.splice(MAX_ACTIVITIES)
  }

  Storage.set(STORAGE_KEY, activities)

  return newActivity
}

/**
 * Generate sample activities for demo/empty feeds
 * @returns {Array} Sample activity items
 */
export function generateSampleActivities() {
  const now = Date.now()
  const hour = 3600000
  const day = 86400000

  const samples = [
    {
      type: 'new_spot',
      userId: 'user_123',
      userName: 'Sarah Nomad',
      userAvatar: '🧳',
      description: t('activityFeed.addedSpot'),
      spotName: 'Highway A1 Exit Berlin-Nord',
      location: { lat: 52.52, lng: 13.405 },
      timestamp: now - hour * 2
    },
    {
      type: 'review',
      userId: 'user_456',
      userName: 'Marco Traveler',
      userAvatar: '🎒',
      description: t('activityFeed.reviewedSpot'),
      spotName: 'Station Total Autobahn A7',
      rating: 5,
      timestamp: now - hour * 5
    },
    {
      type: 'badge',
      userId: 'user_789',
      userName: 'Emma Adventure',
      userAvatar: '🌍',
      description: t('activityFeed.earnedBadge'),
      badgeName: t('badges.explorer'),
      badgeIcon: '🏆',
      timestamp: now - hour * 8
    },
    {
      type: 'checkin',
      userId: 'user_123',
      userName: 'Sarah Nomad',
      userAvatar: '🧳',
      description: t('activityFeed.checkedIn'),
      spotName: 'Rest Area Münster-Süd',
      location: { lat: 51.96, lng: 7.63 },
      timestamp: now - day * 1
    },
    {
      type: 'friend_joined',
      userId: 'user_321',
      userName: 'Alex Wanderer',
      userAvatar: '🚶',
      description: t('activityFeed.joinedSpothitch'),
      timestamp: now - day * 2
    },
    {
      type: 'event_created',
      userId: 'user_456',
      userName: 'Marco Traveler',
      userAvatar: '🎒',
      description: t('activityFeed.createdEvent'),
      eventName: 'Hitchhiking Meetup Hamburg',
      location: { lat: 53.55, lng: 9.99 },
      timestamp: now - day * 3
    },
    {
      type: 'event_joined',
      userId: 'user_789',
      userName: 'Emma Adventure',
      userAvatar: '🌍',
      description: t('activityFeed.joinedEvent'),
      eventName: 'Summer Hitchhiking Festival',
      timestamp: now - day * 4
    },
    {
      type: 'new_spot',
      userId: 'user_654',
      userName: 'Lukas Road',
      userAvatar: '🛣️',
      description: t('activityFeed.addedSpot'),
      spotName: 'Parking Ikea Frankfurt',
      location: { lat: 50.11, lng: 8.68 },
      timestamp: now - day * 5
    }
  ]

  return samples
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}
