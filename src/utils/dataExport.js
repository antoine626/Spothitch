/**
 * Data Export Utility (GDPR Compliance)
 * Allows users to download all their personal data
 */

import { getState } from '../stores/state.js'
import { getCurrentUser, getUserProfile } from '../services/firebase.js'

/**
 * Collect all user data for export
 * @returns {Object} User data object
 */
export async function collectUserData() {
  const state = getState()
  const user = getCurrentUser()

  // Basic profile data
  const profile = {
    username: state.username || null,
    avatar: state.avatar || null,
    email: user?.email || null,
    displayName: user?.displayName || null,
    createdAt: user?.metadata?.creationTime || null,
    lastLoginAt: user?.metadata?.lastSignInTime || null,
  }

  // Try to get additional profile data from Firebase
  if (user?.uid) {
    try {
      const result = await getUserProfile(user.uid)
      if (result.success && result.profile) {
        profile.firebaseProfile = result.profile
      }
    } catch (error) {
      console.warn('Could not fetch Firebase profile:', error)
    }
  }

  // Activity statistics
  const activity = {
    points: state.points || 0,
    totalPoints: state.totalPoints || 0,
    seasonPoints: state.seasonPoints || 0,
    level: state.level || 1,
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    reviewsGiven: state.reviewsGiven || 0,
  }

  // Badges earned
  const badges = state.badges || []

  // Rewards obtained
  const rewards = state.rewards || []

  // Skills unlocked
  const skills = {
    skillPoints: state.skillPoints || 0,
    unlockedSkills: state.unlockedSkills || [],
  }

  // Friends list
  const social = {
    friends: (state.friends || []).map(friend => ({
      id: friend.id,
      username: friend.username,
      avatar: friend.avatar,
      addedAt: friend.addedAt || null,
    })),
    friendRequests: (state.friendRequests || []).map(req => ({
      id: req.id,
      username: req.username,
      status: req.status,
      requestedAt: req.requestedAt || null,
    })),
  }

  // Saved trips
  const trips = {
    savedTrips: (state.savedTrips || []).map(trip => ({
      id: trip.id,
      name: trip.name,
      from: trip.from,
      to: trip.to,
      steps: trip.steps,
      createdAt: trip.createdAt || null,
    })),
    activeTrip: state.activeTrip || null,
  }

  // Emergency contacts (SOS)
  const emergencyContacts = (state.emergencyContacts || []).map(contact => ({
    name: contact.name,
    phone: contact.phone,
    addedAt: contact.addedAt || null,
  }))

  // User preferences
  const preferences = {
    theme: state.theme || 'dark',
    language: state.lang || 'fr',
    notifications: state.notifications !== false,
    tutorialCompleted: state.tutorialCompleted || false,
  }

  // Check-in history (if stored)
  const checkinHistory = state.checkinHistory || []

  // Messages sent (limited to what is stored locally)
  const messages = {
    privateMessages: state.privateMessages || {},
  }

  return {
    exportInfo: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      application: 'SpotHitch',
      applicationVersion: '2.0.0',
    },
    profile,
    activity,
    badges,
    rewards,
    skills,
    social,
    trips,
    emergencyContacts,
    preferences,
    checkinHistory,
    messages,
  }
}

/**
 * Export user data as a JSON file
 * Triggers a download in the browser
 */
export async function exportUserData() {
  try {
    // Collect all user data
    const userData = await collectUserData()

    // Format JSON with indentation for readability
    const jsonString = JSON.stringify(userData, null, 2)

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' })

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]
    const username = userData.profile.username || 'utilisateur'
    const filename = `spothitch_donnees_${username}_${date}.json`

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get a summary of what data will be exported
 * Useful for showing users before they export
 */
export function getExportSummary() {
  const state = getState()

  return {
    profile: true,
    activity: {
      points: state.points || 0,
      level: state.level || 1,
      checkins: state.checkins || 0,
      spotsCreated: state.spotsCreated || 0,
    },
    badges: (state.badges || []).length,
    rewards: (state.rewards || []).length,
    skills: (state.unlockedSkills || []).length,
    friends: (state.friends || []).length,
    savedTrips: (state.savedTrips || []).length,
    emergencyContacts: (state.emergencyContacts || []).length,
  }
}

// Global handler for export
window.exportUserData = async () => {
  const result = await exportUserData()
  if (result.success) {
    window.showToast?.('Donnees exportees avec succes !', 'success')
  } else {
    window.showToast?.('Erreur lors de l\'export des donnees', 'error')
  }
  return result
}

export default { exportUserData, collectUserData, getExportSummary }
