/**
 * Spots Controllers
 * Handles spot selection, filtering, checkin, and reviews
 */

import { setState, getState } from '../stores/state.js'
import { showToast } from '../services/notifications.js'
import { saveValidationToFirebase, saveCommentToFirebase, reportSpot } from '../services/firebase.js'
import { recordCheckin, recordReview } from '../services/gamification.js'
import { announceAction } from '../utils/a11y.js'
import { t } from '../i18n/index.js'
import { sanitizeInput } from '../utils/sanitize.js'

/**
 * Select a spot
 */
export function selectSpot(spotId) {
  const state = getState()
  const spot = state.spots?.find(s => s.id === spotId)
  if (spot) {
    setState({ selectedSpot: spot })
  }
}

/**
 * Close spot detail
 */
export function closeSpotDetail() {
  setState({ selectedSpot: null })
}

/**
 * Open rating modal
 */
export function openRating() {
  setState({ showRating: true })
}

/**
 * Close rating modal
 */
export function closeRating() {
  setState({ showRating: false })
}

/**
 * Open navigation to spot
 */
export function openNavigation(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank')
}

/**
 * Do check-in at spot
 */
export async function doCheckin(spotId) {
  const state = getState()
  recordCheckin()
  await saveValidationToFirebase(spotId, state.user?.uid)
  showToast(t('checkinSuccess'), 'success')
  announceAction('checkin', true)
}

/**
 * Submit a review for a spot
 */
export async function submitReview(spotId) {
  const comment = document.getElementById('review-comment')?.value
  const rating = getState().currentRating || 4

  if (comment) {
    // Sanitize user input
    const safeComment = sanitizeInput(comment)
    await saveCommentToFirebase({ spotId, text: safeComment, rating })
    recordReview()
    showToast('Avis publié !', 'success')
    setState({ showRating: false })
  }
}

/**
 * Set rating value
 */
export function setRating(rating) {
  setState({ currentRating: rating })
}

/**
 * Report a spot
 */
export async function reportSpotAction(spotId) {
  const reason = prompt('Raison du signalement ?')
  if (reason) {
    const safeReason = sanitizeInput(reason)
    await reportSpot(spotId, safeReason)
    showToast('Signalement envoyé', 'success')
  }
}

/**
 * Set search query
 */
export function setSearchQuery(query) {
  setState({ searchQuery: query })
}

/**
 * Set filter
 */
export function setFilter(filter) {
  setState({ activeFilter: filter })
}

/**
 * Set country filter
 */
export function setCountryFilter(country) {
  setState({ filterCountry: country })
}

// Register global handlers
export function registerSpotsHandlers() {
  window.selectSpot = selectSpot
  window.closeSpotDetail = closeSpotDetail
  window.openRating = openRating
  window.closeRating = closeRating
  window.openNavigation = openNavigation
  window.doCheckin = doCheckin
  window.submitReview = submitReview
  window.setRating = setRating
  window.reportSpotAction = reportSpotAction
  window.setSearchQuery = setSearchQuery
  window.setFilter = setFilter
  window.setCountryFilter = setCountryFilter
}

export default {
  selectSpot,
  closeSpotDetail,
  openRating,
  closeRating,
  openNavigation,
  doCheckin,
  submitReview,
  setRating,
  reportSpotAction,
  setSearchQuery,
  setFilter,
  setCountryFilter,
  registerSpotsHandlers,
}
