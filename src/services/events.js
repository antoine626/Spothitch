/**
 * Events Service
 * Create/join community events with Facebook-style comment wall
 * localStorage-backed with anti-spam (24h account age requirement)
 */

import { getState, setState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'
import { t } from '../i18n/index.js'

// Storage keys
const EVENTS_KEY = 'spothitch_events'
const COMMENTS_KEY = 'spothitch_event_comments'

// Event types
export const EVENT_TYPES = {
  meetup: { id: 'meetup', icon: '🤝', color: 'text-primary-400', bg: 'bg-primary-500/20' },
  group_departure: { id: 'group_departure', icon: '🚗', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  hostel_party: { id: 'hostel_party', icon: '🎉', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  tips_exchange: { id: 'tips_exchange', icon: '💡', color: 'text-purple-400', bg: 'bg-purple-500/20' },
}

/**
 * Get events from storage
 * @returns {Array}
 */
function getEventsStorage() {
  try {
    const data = Storage.get(EVENTS_KEY)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Save events to storage
 * @param {Array} events
 */
function saveEventsStorage(events) {
  try {
    Storage.set(EVENTS_KEY, events)
  } catch (e) {
    console.error('[Events] Storage error:', e)
  }
}

/**
 * Get comments from storage
 * @returns {Object} { eventId: [comments] }
 */
function getCommentsStorage() {
  try {
    return Storage.get(COMMENTS_KEY) || {}
  } catch {
    return {}
  }
}

/**
 * Save comments to storage
 * @param {Object} data
 */
function saveCommentsStorage(data) {
  try {
    Storage.set(COMMENTS_KEY, data)
  } catch (e) {
    console.error('[Events] Comments storage error:', e)
  }
}

/**
 * Check if account is old enough to create events (24h)
 * @returns {boolean}
 */
function isAccountOldEnough() {
  const state = getState()
  const createdAt = state.user?.metadata?.creationTime
  if (!createdAt) {
    // For local users without Firebase, check localStorage
    const localCreated = Storage.get('spothitch_account_created')
    if (!localCreated) {
      // First time - set creation time
      Storage.set('spothitch_account_created', new Date().toISOString())
      return false
    }
    const diff = Date.now() - new Date(localCreated).getTime()
    return diff >= 24 * 60 * 60 * 1000
  }
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff >= 24 * 60 * 60 * 1000
}

/**
 * Create a new event
 * @param {Object} eventData - { title, type, location, date, time, description, visibility }
 * @returns {Object} { success, event }
 */
export function createEvent(eventData) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'

  if (!eventData.title || !eventData.title.trim()) {
    return { success: false, error: 'missing_title' }
  }

  if (!eventData.type || !EVENT_TYPES[eventData.type]) {
    return { success: false, error: 'invalid_type' }
  }

  if (!eventData.date) {
    return { success: false, error: 'missing_date' }
  }

  if (!isAccountOldEnough()) {
    return { success: false, error: 'account_too_new' }
  }

  const event = {
    id: `event_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    title: eventData.title.trim(),
    type: eventData.type,
    location: eventData.location || '',
    locationCoords: eventData.locationCoords || null,
    date: eventData.date,
    time: eventData.time || '',
    description: eventData.description || '',
    visibility: eventData.visibility || 'public',
    creatorId: userId,
    creatorName: state.username || t('traveler') || 'Voyageur',
    creatorAvatar: state.avatar || '🤙',
    participants: [userId],
    participantNames: { [userId]: state.username || t('traveler') || 'Voyageur' },
    participantAvatars: { [userId]: state.avatar || '🤙' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const events = getEventsStorage()
  events.push(event)
  saveEventsStorage(events)

  return { success: true, event }
}

/**
 * Get all upcoming events sorted by date
 * @param {Object} filters - { type, visibility }
 * @returns {Array}
 */
export function getUpcomingEvents(filters = {}) {
  const events = getEventsStorage()
  const now = new Date().toISOString().split('T')[0]

  let filtered = events.filter(e => e.date >= now)

  if (filters.type) {
    filtered = filtered.filter(e => e.type === filters.type)
  }

  if (filters.visibility) {
    filtered = filtered.filter(e => e.visibility === filters.visibility)
  }

  // Sort by date ascending (soonest first)
  filtered.sort((a, b) => a.date.localeCompare(b.date))

  return filtered
}

/**
 * Get past events
 * @returns {Array}
 */
export function getPastEvents() {
  const events = getEventsStorage()
  const now = new Date().toISOString().split('T')[0]
  return events.filter(e => e.date < now).sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Get event by ID
 * @param {string} eventId
 * @returns {Object|null}
 */
export function getEventById(eventId) {
  const events = getEventsStorage()
  return events.find(e => e.id === eventId) || null
}

/**
 * Join an event
 * @param {string} eventId
 * @returns {Object} { success }
 */
export function joinEvent(eventId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const events = getEventsStorage()
  const eventIndex = events.findIndex(e => e.id === eventId)

  if (eventIndex === -1) {
    return { success: false, error: 'event_not_found' }
  }

  const event = events[eventIndex]

  if (event.participants.includes(userId)) {
    return { success: false, error: 'already_joined' }
  }

  event.participants.push(userId)
  event.participantNames = event.participantNames || {}
  event.participantNames[userId] = state.username || t('traveler') || 'Voyageur'
  event.participantAvatars = event.participantAvatars || {}
  event.participantAvatars[userId] = state.avatar || '🤙'
  event.updatedAt = new Date().toISOString()

  events[eventIndex] = event
  saveEventsStorage(events)

  return { success: true }
}

/**
 * Leave an event
 * @param {string} eventId
 * @returns {Object} { success }
 */
export function leaveEvent(eventId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const events = getEventsStorage()
  const eventIndex = events.findIndex(e => e.id === eventId)

  if (eventIndex === -1) {
    return { success: false, error: 'event_not_found' }
  }

  const event = events[eventIndex]

  // Creator cannot leave
  if (event.creatorId === userId) {
    return { success: false, error: 'creator_cannot_leave' }
  }

  event.participants = event.participants.filter(p => p !== userId)
  if (event.participantNames) delete event.participantNames[userId]
  if (event.participantAvatars) delete event.participantAvatars[userId]
  event.updatedAt = new Date().toISOString()

  events[eventIndex] = event
  saveEventsStorage(events)

  return { success: true }
}

/**
 * Delete an event (creator only)
 * @param {string} eventId
 * @returns {Object} { success }
 */
export function deleteEvent(eventId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const events = getEventsStorage()
  const event = events.find(e => e.id === eventId)

  if (!event) {
    return { success: false, error: 'event_not_found' }
  }

  if (event.creatorId !== userId) {
    return { success: false, error: 'not_creator' }
  }

  const filtered = events.filter(e => e.id !== eventId)
  saveEventsStorage(filtered)

  // Also delete comments
  const comments = getCommentsStorage()
  delete comments[eventId]
  saveCommentsStorage(comments)

  return { success: true }
}

/**
 * Post a comment on an event
 * @param {string} eventId
 * @param {string} text
 * @param {string|null} replyToId - Parent comment ID for replies
 * @returns {Object} { success, comment }
 */
export function postEventComment(eventId, text, replyToId = null) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'

  if (!text || !text.trim()) {
    return { success: false, error: 'empty_comment' }
  }

  const comments = getCommentsStorage()
  if (!comments[eventId]) {
    comments[eventId] = []
  }

  const comment = {
    id: `comment_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    eventId,
    text: text.trim(),
    userId,
    userName: state.username || t('traveler') || 'Voyageur',
    userAvatar: state.avatar || '🤙',
    replyToId,
    reactions: {},
    createdAt: new Date().toISOString(),
  }

  comments[eventId].push(comment)
  saveCommentsStorage(comments)

  return { success: true, comment }
}

/**
 * Get comments for an event
 * @param {string} eventId
 * @returns {Array}
 */
export function getEventComments(eventId) {
  const comments = getCommentsStorage()
  return comments[eventId] || []
}

/**
 * React to a comment with emoji
 * @param {string} eventId
 * @param {string} commentId
 * @param {string} emoji
 * @returns {Object} { success }
 */
export function reactToComment(eventId, commentId, emoji) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const comments = getCommentsStorage()
  const eventComments = comments[eventId] || []
  const comment = eventComments.find(c => c.id === commentId)

  if (!comment) {
    return { success: false, error: 'comment_not_found' }
  }

  if (!comment.reactions) comment.reactions = {}
  if (!comment.reactions[emoji]) comment.reactions[emoji] = []

  // Toggle reaction
  const userIndex = comment.reactions[emoji].indexOf(userId)
  if (userIndex !== -1) {
    comment.reactions[emoji].splice(userIndex, 1)
    if (comment.reactions[emoji].length === 0) {
      delete comment.reactions[emoji]
    }
  } else {
    comment.reactions[emoji].push(userId)
  }

  comments[eventId] = eventComments
  saveCommentsStorage(comments)

  return { success: true }
}

/**
 * Delete a comment (author only)
 * @param {string} eventId
 * @param {string} commentId
 * @returns {Object} { success }
 */
export function deleteEventComment(eventId, commentId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const comments = getCommentsStorage()
  const eventComments = comments[eventId] || []
  const comment = eventComments.find(c => c.id === commentId)

  if (!comment) {
    return { success: false, error: 'comment_not_found' }
  }

  if (comment.userId !== userId) {
    return { success: false, error: 'not_author' }
  }

  comments[eventId] = eventComments.filter(c => c.id !== commentId)
  saveCommentsStorage(comments)

  return { success: true }
}

/**
 * Share an event
 * @param {string} eventId
 * @returns {Object} { success }
 */
export function shareEvent(eventId) {
  const event = getEventById(eventId)
  if (!event) return { success: false }

  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const shareText = `${typeInfo.icon} ${event.title} - ${event.date} - SpotHitch`

  if (navigator.share) {
    navigator.share({
      title: event.title,
      text: shareText,
      url: window.location.href,
    }).catch(() => {})
  } else {
    // Fallback to clipboard
    navigator.clipboard?.writeText(shareText)
  }

  return { success: true }
}

/**
 * Get events the current user has joined
 * @returns {Array}
 */
export function getMyEvents() {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const events = getEventsStorage()
  return events.filter(e => e.participants.includes(userId))
}

// ==================== GLOBAL HANDLERS ====================

window.openCreateEvent = () => {
  setState({ showCreateEvent: true })
}

window.closeCreateEvent = () => {
  setState({ showCreateEvent: false })
}

window.submitCreateEvent = () => {
  const title = document.getElementById('event-title')?.value
  const type = document.getElementById('event-type')?.value
  const location = document.getElementById('event-location')?.value
  const date = document.getElementById('event-date')?.value
  const time = document.getElementById('event-time')?.value
  const description = document.getElementById('event-description')?.value
  const visibility = document.getElementById('event-visibility')?.value || 'public'

  const result = createEvent({ title, type, location, date, time, description, visibility })

  if (result.success) {
    window.showToast?.(t('eventCreated') || 'Evenement cree !', 'success')
    setState({ showCreateEvent: false, eventsLastUpdate: Date.now() })
  } else if (result.error === 'account_too_new') {
    window.showToast?.(t('accountTooNewForEvents') || 'Ton compte doit avoir plus de 24h pour creer un evenement', 'warning')
  } else if (result.error === 'missing_title') {
    window.showToast?.(t('eventTitleRequired') || 'Le titre est obligatoire', 'warning')
  } else if (result.error === 'missing_date') {
    window.showToast?.(t('eventDateRequired') || 'La date est obligatoire', 'warning')
  } else {
    window.showToast?.(t('eventCreationError') || 'Erreur lors de la creation', 'error')
  }
}

window.joinEvent = (eventId) => {
  const result = joinEvent(eventId)
  if (result.success) {
    window.showToast?.(t('eventJoined') || 'Tu as rejoint l\'evenement !', 'success')
    setState({ eventsLastUpdate: Date.now() })
  } else if (result.error === 'already_joined') {
    window.showToast?.(t('alreadyJoinedEvent') || 'Tu participes deja', 'info')
  }
}

window.leaveEvent = (eventId) => {
  const result = leaveEvent(eventId)
  if (result.success) {
    window.showToast?.(t('eventLeft') || 'Tu as quitte l\'evenement', 'info')
    setState({ eventsLastUpdate: Date.now(), selectedEvent: null })
  } else if (result.error === 'creator_cannot_leave') {
    window.showToast?.(t('creatorCannotLeave') || 'Le createur ne peut pas quitter l\'evenement', 'warning')
  }
}

window.deleteEventAction = (eventId) => {
  if (window.confirm(t('confirmDeleteEvent') || 'Supprimer cet evenement ?')) {
    const result = deleteEvent(eventId)
    if (result.success) {
      window.showToast?.(t('eventDeleted') || 'Evenement supprime', 'info')
      setState({ selectedEvent: null, eventsLastUpdate: Date.now() })
    }
  }
}

window.openEventDetail = (eventId) => {
  const event = getEventById(eventId)
  if (event) {
    setState({ selectedEvent: event })
  }
}

window.closeEventDetail = () => {
  setState({ selectedEvent: null })
}

window.postEventComment = (eventId) => {
  const input = document.getElementById('event-comment-input')
  if (!input?.value?.trim()) return

  const text = input.value.trim()
  input.value = ''

  const result = postEventComment(eventId, text)
  if (result.success) {
    setState({ eventsLastUpdate: Date.now() })
  }
}

window.replyEventComment = (eventId, commentId) => {
  const input = document.getElementById(`reply-input-${commentId}`)
  if (!input?.value?.trim()) return

  const text = input.value.trim()
  input.value = ''

  const result = postEventComment(eventId, text, commentId)
  if (result.success) {
    setState({ eventsLastUpdate: Date.now() })
  }
}

window.toggleReplyInput = (commentId) => {
  const el = document.getElementById(`reply-section-${commentId}`)
  if (el) {
    el.classList.toggle('hidden')
    const input = document.getElementById(`reply-input-${commentId}`)
    if (input && !el.classList.contains('hidden')) {
      input.focus()
    }
  }
}

window.reactToEventComment = (eventId, commentId, emoji) => {
  reactToComment(eventId, commentId, emoji)
  setState({ eventsLastUpdate: Date.now() })
}

window.shareEvent = (eventId) => {
  shareEvent(eventId)
  window.showToast?.(t('eventShared') || 'Evenement partage !', 'success')
}

window.deleteEventCommentAction = (eventId, commentId) => {
  const result = deleteEventComment(eventId, commentId)
  if (result.success) {
    setState({ eventsLastUpdate: Date.now() })
  }
}

export default {
  EVENT_TYPES,
  createEvent,
  getUpcomingEvents,
  getPastEvents,
  getEventById,
  joinEvent,
  leaveEvent,
  deleteEvent,
  postEventComment,
  getEventComments,
  reactToComment,
  deleteEventComment,
  shareEvent,
  getMyEvents,
}
