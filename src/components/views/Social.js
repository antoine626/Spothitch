/**
 * Social View Component
 * 3 tabs: Feed | Conversations | Amis
 * Orchestrator that delegates to sub-components
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { escapeHTML } from '../../utils/sanitize.js'
import { renderFeed } from './social/Feed.js'
import { renderConversations } from './social/Conversations.js'
import { renderFriends } from './social/Friends.js'
import { renderSkeletonChatList } from '../ui/Skeleton.js'
import { getTrustBadge } from '../../services/identityVerification.js'
import { getConversationsList, getConversationMessages } from '../../services/directMessages.js'
import { getUpcomingEvents, getEventComments, EVENT_TYPES } from '../../services/events.js'

// ==================== MAIN RENDER ====================

export function renderSocial(state) {
  const mainTab = state.socialSubTab || 'feed'

  // Zone chat overlay
  if (state.showZoneChat) {
    return renderZoneChatOverlay(state)
  }

  // Event detail overlay
  if (state.selectedEvent) {
    return renderEventDetail(state, state.selectedEvent)
  }

  // Event create form
  if (state.showCreateEvent) {
    return renderCreateEventForm()
  }

  // Companion search view
  if (mainTab === 'companion') {
    return `
      <div class="flex flex-col h-[calc(100vh-140px)]">
        ${renderMainTabs(mainTab, state)}
        ${renderCompanionSearch(state)}
      </div>
    `
  }

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      ${renderMainTabs(mainTab, state)}
      ${mainTab === 'feed'
    ? renderFeed(state)
    : mainTab === 'conversations'
      ? renderConversations(state)
      : renderFriends(state)}
    </div>
  `
}

function renderMainTabs(activeTab, state) {
  const realTab = activeTab === 'companion' ? 'friends' : activeTab
  return `
    <div class="flex bg-dark-secondary/50">
      ${renderMainTab('feed', realTab, 'activity', t('socialFeed'), 0)}
      ${renderMainTab('conversations', realTab, 'message-circle', t('socialConversations'), state.unreadDMCount)}
      ${renderMainTab('friends', realTab, 'users', t('socialFriends'), 0)}
    </div>
  `
}

function renderMainTab(id, activeTab, iconName, label, badge) {
  const isActive = activeTab === id
  return `
    <button
      onclick="setSocialTab('${id}')"
      class="flex-1 py-3 px-2 font-medium text-sm transition-all relative border-b-2 ${
    isActive
      ? 'border-primary-500 text-primary-400'
      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
  }"
    >
      ${icon(iconName, 'w-5 h-5 mr-1')}
      ${label}
      ${(badge || 0) > 0 ? `
        <span class="absolute top-1 right-2 w-5 h-5 bg-danger-500 rounded-full text-xs flex items-center justify-center text-white">
          ${badge}
        </span>
      ` : ''}
    </button>
  `
}

// ==================== ZONE CHAT OVERLAY ====================

function renderZoneChatOverlay(state) {
  const rooms = [
    { id: 'general', name: t('general'), icon: '💬' },
    { id: 'europe', name: t('europe'), icon: '🇪🇺' },
    { id: 'help', name: t('help'), icon: '❓' },
    { id: 'meetups', name: t('meetups'), icon: '🤝' },
    { id: 'routes', name: t('routes'), icon: '🛣️' },
  ]

  const currentRoom = state.chatRoom || 'general'
  const messages = (state.messages || []).filter(m => !m.room || m.room === currentRoom)

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <!-- Header -->
      <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
        <button onclick="closeZoneChat()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
          ${icon('arrow-left', 'w-5 h-5')}
        </button>
        <div class="flex-1">
          <div class="font-medium text-sm">${t('zoneChatRooms')}</div>
        </div>
      </div>

      <!-- Room pills -->
      <div class="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        ${rooms.map(room => `
          <button
            onclick="setChatRoom('${room.id}')"
            class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
    currentRoom === room.id
      ? 'bg-primary-500 text-white'
      : 'bg-white/5 text-slate-400 hover:bg-white/10'
  }"
          >
            <span>${room.icon}</span> ${room.name}
          </button>
        `).join('')}
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="chat-messages" role="log" aria-live="polite">
        ${state.chatLoading
    ? renderSkeletonChatList(6)
    : messages.length > 0
      ? messages.map(msg => renderZoneMessage(msg, state)).join('')
      : `
            <div class="text-center py-12">
              <span class="text-5xl mb-4 block">💬</span>
              <h3 class="text-lg font-bold mb-2">${t('noChatMessages')}</h3>
              <p class="text-slate-400 text-sm">${t('beFirstToWrite')}</p>
            </div>
          `}
      </div>

      <!-- Input -->
      <div class="p-3 glass-dark">
        <form class="flex gap-2" onsubmit="event.preventDefault(); sendMessage('${currentRoom}');">
          <input
            type="text"
            class="input-field flex-1"
            placeholder="${t('typeMessage')}"
            id="chat-input"
            autocomplete="off"
            aria-label="${t('typeMessage')}"
          />
          <button type="submit" class="btn-primary px-4" aria-label="${t('send')}">
            ${icon('paper-plane', 'w-5 h-5')}
          </button>
        </form>
      </div>
    </div>
  `
}

function renderZoneMessage(msg, state) {
  const isSent = msg.userId === (state.user?.uid || 'local-user')
  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isSent ? 'bg-primary-500/20' : 'bg-white/5'} rounded-2xl px-4 py-2 ${isSent ? 'rounded-br-md' : 'rounded-bl-md'}">
        ${!isSent ? `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">${escapeHTML(msg.userAvatar || '🤙')}</span>
            <span class="text-xs font-medium text-primary-400">${escapeHTML(msg.userName || '')}</span>
          </div>
        ` : ''}
        <p class="text-sm text-white">${escapeHTML(msg.text || '')}</p>
        <time class="text-xs text-slate-400 mt-1 block ${isSent ? 'text-right' : ''}">
          ${formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  `
}

// ==================== COMPANION SEARCH ====================

function renderCompanionSearch(state) {
  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <button onclick="setSocialTab('friends')" class="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        ${icon('arrow-left', 'w-4 h-4')} ${t('back')}
      </button>

      <div class="card p-5 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('compass', 'w-5 h-5 text-emerald-400')}
          ${t('lookingForCompanion')}
        </h3>
        <p class="text-sm text-slate-400 mb-4">${t('companionDesc')}</p>
        <div class="space-y-3">
          <div class="flex gap-2">
            <input type="text" id="companion-from" class="input-field flex-1" placeholder="${t('from')}" />
            <input type="text" id="companion-to" class="input-field flex-1" placeholder="${t('to')}" />
          </div>
          <div class="flex gap-2">
            <input type="date" id="companion-date" class="input-field flex-1" min="${new Date().toISOString().split('T')[0]}" />
            <button onclick="postCompanionRequest()" class="btn-primary px-4">
              ${icon('paper-plane', 'w-5 h-5 mr-1')}
              ${t('publish')}
            </button>
          </div>
        </div>
      </div>

      ${renderCompanionRequests(state)}
    </div>
  `
}

function renderCompanionRequests(state) {
  const requests = state.companionRequests || []

  if (requests.length === 0) {
    return `
      <div class="text-center py-6">
        <span class="text-4xl mb-3 block">🤝</span>
        <p class="text-sm text-slate-400">${t('noCompanionRequests')}</p>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      <h4 class="font-bold text-sm text-slate-400">${t('activeRequests')}</h4>
      ${requests.map(req => `
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">${req.avatar || '🤙'}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">${escapeHTML(req.name || '')}</div>
              <div class="text-xs text-slate-400">${formatRelativeTime(req.createdAt)}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            ${icon('map-pin', 'w-4 h-4 text-primary-400')}
            <span class="text-slate-300">${escapeHTML(req.from || '')} → ${escapeHTML(req.to || '')}</span>
          </div>
          ${req.date ? `
            <div class="flex items-center gap-2 text-sm mt-1">
              ${icon('calendar', 'w-4 h-4 text-amber-400')}
              <span class="text-slate-400">${formatEventDate(req.date)}</span>
            </div>
          ` : ''}
          <button onclick="openConversation('${req.userId}')" class="mt-3 w-full btn-primary text-sm py-2">
            ${icon('comment', 'w-4 h-4 mr-1')}
            ${t('contactTraveler')}
          </button>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== EVENT DETAIL (kept for overlay) ====================

function renderEventDetail(state, event) {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const userId = state.user?.uid || 'local-user'
  const isParticipant = event.participants?.includes(userId)
  const isCreator = event.creatorId === userId
  const participantCount = event.participants?.length || 0
  const comments = getEventComments(event.id)
  const topComments = comments.filter(c => !c.replyToId)
  const replies = comments.filter(c => c.replyToId)

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <div class="flex-1 overflow-y-auto">
        <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
          <button onclick="closeEventDetail()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
            ${icon('arrow-left', 'w-5 h-5')}
          </button>
          <div class="flex-1"><div class="font-medium text-sm">${t('eventDetail')}</div></div>
          <button onclick="shareEvent('${event.id}')" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('share')}">
            ${icon('share-alt', 'w-5 h-5')}
          </button>
          ${isCreator ? `
            <button onclick="deleteEventAction('${event.id}')" class="w-9 h-9 rounded-full bg-danger-500/10 flex items-center justify-center text-danger-400 hover:bg-danger-500/20" aria-label="${t('deleteEvent')}">
              ${icon('trash', 'w-5 h-5')}
            </button>
          ` : ''}
        </div>

        <div class="p-5 space-y-4 overflow-x-hidden">
          <div class="card p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-14 h-14 rounded-xl ${typeInfo.bg} flex items-center justify-center">
                <span class="text-3xl">${typeInfo.icon}</span>
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-bold">${escapeHTML(event.title || '')}</h2>
                <div class="text-sm ${typeInfo.color}">${t('eventType_' + event.type) || event.type}</div>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-slate-300">${icon('calendar', 'w-5 h-5 text-slate-400')} ${formatEventDate(event.date)}${event.time ? ` ${t('at')} ${event.time}` : ''}</div>
              ${event.location ? `<div class="flex items-center gap-2 text-slate-300">${icon('map-marker-alt', 'w-5 h-5 text-slate-400')} ${escapeHTML(event.location)}</div>` : ''}
              <div class="flex items-center gap-2 text-slate-300">${icon('users', 'w-5 h-5 text-slate-400')} ${participantCount} ${t('participants')}</div>
              <div class="flex items-center gap-2 text-slate-300">${icon('user', 'w-5 h-5 text-slate-400')} ${t('createdBy')} ${event.creatorAvatar || '🤙'} ${escapeHTML(event.creatorName || '')}</div>
            </div>
            ${event.description ? `<div class="mt-3 pt-3 border-t border-white/10"><p class="text-sm text-slate-300">${escapeHTML(event.description)}</p></div>` : ''}
          </div>

          <div>
            ${isParticipant && !isCreator ? `
              <button onclick="leaveEvent('${event.id}')" class="w-full py-3 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-all">
                ${icon('sign-out-alt', 'w-5 h-5 mr-2')} ${t('leaveEvent')}
              </button>
            ` : !isParticipant ? `
              <button onclick="joinEvent('${event.id}')" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all">
                ${icon('user-plus', 'w-5 h-5 mr-2')} ${t('joinEvent')}
              </button>
            ` : `
              <div class="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium text-center">
                ${icon('check', 'w-5 h-5 mr-2')} ${t('youAreOrganizer')}
              </div>
            `}
          </div>

          <div class="card p-5">
            <h3 class="font-bold text-sm mb-4 flex items-center gap-2">
              ${icon('comments', 'w-5 h-5 text-primary-400')}
              ${t('commentWall')} (${comments.length})
            </h3>
            <div class="flex gap-2 mb-4">
              <input type="text" class="input-field flex-1" placeholder="${t('writeComment')}" id="event-comment-input" autocomplete="off" onkeydown="if(event.key==='Enter') postEventComment('${event.id}')" />
              <button onclick="postEventComment('${event.id}')" class="btn-primary px-4" aria-label="${t('send')}">
                ${icon('paper-plane', 'w-5 h-5')}
              </button>
            </div>
            <div class="space-y-3">
              ${topComments.length > 0
    ? topComments.map(c => renderEventComment(c, replies, event.id, userId)).join('')
    : `<p class="text-slate-400 text-sm text-center py-4">${t('noCommentsYet')}</p>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderEventComment(comment, allReplies, eventId, userId) {
  const isAuthor = comment.userId === userId
  const commentReplies = allReplies.filter(r => r.replyToId === comment.id)
  const reactionEmojis = ['👍', '❤️', '😂', '🤙']

  const reactionDisplay = Object.entries(comment.reactions || {})
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => `
      <button onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')" class="px-2 py-0.5 rounded-full text-xs ${users.includes(userId) ? 'bg-primary-500/30 text-primary-300' : 'bg-white/10 text-slate-400'} hover:bg-white/20 transition-all">
        ${emoji} ${users.length}
      </button>
    `).join('')

  return `
    <div class="bg-white/5 rounded-xl p-3">
      <div class="flex items-start gap-2">
        <span class="text-xl shrink-0">${comment.userAvatar || '🤙'}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm">${escapeHTML(comment.userName || '')}</span>
            <time class="text-xs text-slate-400">${formatRelativeTime(comment.createdAt)}</time>
            ${isAuthor ? `
              <button onclick="deleteEventCommentAction('${eventId}', '${comment.id}')" class="text-xs text-slate-400 hover:text-danger-400 ml-auto" aria-label="${t('deleteComment')}">
                ${icon('trash-alt', 'w-4 h-4')}
              </button>
            ` : ''}
          </div>
          <p class="text-sm text-slate-300 mt-1">${escapeHTML(comment.text || '')}</p>
          <div class="flex items-center gap-1 mt-2 flex-wrap">
            ${reactionDisplay}
            ${reactionEmojis.map(emoji => `
              <button onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')" class="px-1.5 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all" title="${emoji}">
                ${emoji}
              </button>
            `).join('')}
            <button onclick="toggleReplyInput('${comment.id}')" class="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all ml-1">
              ${icon('reply', 'w-4 h-4 mr-1')} ${t('reply')}
            </button>
          </div>
          ${commentReplies.length > 0 ? `
            <div class="mt-2 pl-3 border-l-2 border-white/10 space-y-2">
              ${commentReplies.map(reply => `
                <div class="flex items-start gap-2">
                  <span class="text-sm shrink-0">${reply.userAvatar || '🤙'}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-xs">${escapeHTML(reply.userName || '')}</span>
                      <time class="text-xs text-slate-400">${formatRelativeTime(reply.createdAt)}</time>
                    </div>
                    <p class="text-xs text-slate-300 mt-0.5">${escapeHTML(reply.text || '')}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div id="reply-section-${comment.id}" class="hidden mt-2">
            <div class="flex gap-2">
              <input type="text" class="input-field flex-1 text-sm" placeholder="${t('writeReply')}" id="reply-input-${comment.id}" onkeydown="if(event.key==='Enter') replyEventComment('${eventId}', '${comment.id}')" />
              <button onclick="replyEventComment('${eventId}', '${comment.id}')" class="btn-primary px-3 text-sm" aria-label="${t('send')}">
                ${icon('reply', 'w-4 h-4')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderCreateEventForm() {
  const today = new Date().toISOString().split('T')[0]

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <div class="flex items-center gap-3 mb-2">
          <button onclick="closeCreateEvent()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
            ${icon('arrow-left', 'w-5 h-5')}
          </button>
          <h2 class="text-lg font-bold flex items-center gap-2">
            ${icon('calendar-plus', 'w-5 h-5 text-primary-400')}
            ${t('createEvent')}
          </h2>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-sm text-slate-400 mb-1 block">${t('eventTitle')} *</label>
            <input type="text" id="event-title" class="input-field w-full" placeholder="${t('eventTitlePlaceholder')}" maxlength="80" />
          </div>
          <div>
            <label class="text-sm text-slate-400 mb-1 block">${t('eventType')} *</label>
            <select id="event-type" class="input-field w-full">
              <option value="meetup">${EVENT_TYPES.meetup.icon} ${t('eventType_meetup')}</option>
              <option value="group_departure">${EVENT_TYPES.group_departure.icon} ${t('eventType_group_departure')}</option>
              <option value="hostel_party">${EVENT_TYPES.hostel_party.icon} ${t('eventType_hostel_party')}</option>
              <option value="tips_exchange">${EVENT_TYPES.tips_exchange.icon} ${t('eventType_tips_exchange')}</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-slate-400 mb-1 block">${t('eventLocation')}</label>
            <input type="text" id="event-location" class="input-field w-full" placeholder="${t('eventLocationPlaceholder')}" />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="text-sm text-slate-400 mb-1 block">${t('eventDate')} *</label>
              <input type="date" id="event-date" class="input-field w-full" min="${today}" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-slate-400 mb-1 block">${t('eventTime')}</label>
              <input type="time" id="event-time" class="input-field w-full" />
            </div>
          </div>
          <div>
            <label class="text-sm text-slate-400 mb-1 block">${t('eventDescription')}</label>
            <textarea id="event-description" class="input-field w-full h-24 resize-none" placeholder="${t('eventDescriptionPlaceholder')}" maxlength="500"></textarea>
          </div>
          <button onclick="submitCreateEvent()" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all">
            ${icon('calendar-plus', 'w-5 h-5 mr-2')}
            ${t('publishEvent')}
          </button>
        </div>
      </div>
    </div>
  `
}

// ==================== UTILITIES ====================

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('justNow')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}${t('daysShort')}`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ==================== GLOBAL HANDLERS ====================

window.setSocialTab = (tab) => {
  window.setState?.({ socialSubTab: tab })
}

window.postCompanionRequest = async () => {
  const from = document.getElementById('companion-from')?.value?.trim()
  const to = document.getElementById('companion-to')?.value?.trim()
  const date = document.getElementById('companion-date')?.value

  if (!from || !to) {
    window.showToast?.(t('fillFromTo'), 'warning')
    return
  }

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const requests = state.companionRequests || []
  const newReq = {
    id: `comp_${Date.now()}`,
    userId: state.user?.uid || 'local-user',
    name: state.username || t('traveler'),
    avatar: state.avatar || '🤙',
    from,
    to,
    date: date || null,
    createdAt: new Date().toISOString(),
  }

  setState({ companionRequests: [newReq, ...requests] })
  window.showToast?.(t('companionRequestPosted'), 'success')
}

window.openFriendChat = (friendId) => {
  window.setState?.({ socialSubTab: 'conversations', activeDMConversation: friendId })
}

window.closeFriendChat = () => {
  window.setState?.({ activeDMConversation: null })
}

window.sendMessage = async (room) => {
  const input = document.getElementById('chat-input')
  if (!input?.value.trim()) return

  const text = input.value.trim()
  input.value = ''

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const messages = state.messages || []

  const newMsg = {
    id: Date.now().toString(),
    room: room || 'general',
    text,
    userName: state.username || t('traveler'),
    userAvatar: state.avatar || '🤙',
    userId: state.user?.uid || 'local-user',
    createdAt: new Date().toISOString(),
  }

  const updatedMessages = [...messages, newMsg]
  setState({ messages: updatedMessages })

  try {
    localStorage.setItem('spothitch_messages', JSON.stringify(updatedMessages.slice(-100)))
  } catch { /* quota exceeded */ }

  try {
    const { sendChatMessage } = await import('../../services/firebase.js')
    await sendChatMessage(room, text)
  } catch { /* Firebase not configured */ }

  setTimeout(() => {
    const chatEl = document.getElementById('chat-messages')
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
  }, 50)
}

window.sendPrivateMessage = async (friendId) => {
  const input = document.getElementById('private-chat-input')
  if (!input?.value.trim()) return

  const text = input.value.trim()
  input.value = ''

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const privateMessages = state.privateMessages || {}
  const friendMsgs = privateMessages[friendId] || []

  const newMsg = {
    id: Date.now().toString(),
    text,
    userName: state.username || 'Moi',
    userAvatar: state.avatar || '🤙',
    userId: state.user?.uid || 'local-user',
    createdAt: new Date().toISOString(),
  }

  const updatedFriendMsgs = [...friendMsgs, newMsg]
  const updatedPrivateMessages = { ...privateMessages, [friendId]: updatedFriendMsgs }
  setState({ privateMessages: updatedPrivateMessages })

  try {
    localStorage.setItem('spothitch_private_messages', JSON.stringify(updatedPrivateMessages))
  } catch { /* quota exceeded */ }

  setTimeout(() => {
    const chatEl = document.getElementById('private-messages')
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
  }, 50)
}

window.acceptFriendRequest = async (requestId) => {
  window.showSuccess?.(t('friendAdded'))
  try {
    const { triggerFriendAddedTip } = await import('../../services/contextualTips.js')
    triggerFriendAddedTip()
  } catch { /* no-op */ }
}

window.declineFriendRequest = () => { /* no-op */ }

window.showAddFriend = () => {
  window.setState?.({ socialSubTab: 'friends' })
  setTimeout(() => document.getElementById('friend-search')?.focus(), 100)
}

window.addFriendByName = async () => {
  const input = document.getElementById('friend-search')
  const name = input?.value?.trim()
  if (!name) {
    window.showToast?.(t('enterTravelerName'), 'warning')
    return
  }

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const friends = state.friends || []

  if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    window.showToast?.(t('alreadyFriend'), 'warning')
    return
  }

  const avatars = ['🤙', '🧗', '🏄', '🚶', '🧭', '🎒', '🌍', '🛤️']
  const newFriend = {
    id: `friend_${Date.now()}`,
    name,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    level: Math.floor(Math.random() * 10) + 1,
    online: Math.random() > 0.5,
    unread: 0,
    addedAt: new Date().toISOString(),
  }

  setState({ friends: [...friends, newFriend] })
  if (input) input.value = ''
  window.showToast?.(t('friendAdded'), 'success')
}

window.removeFriend = async (friendId) => {
  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  setState({ friends: (state.friends || []).filter(f => f.id !== friendId) })
  window.showToast?.(t('friendRemoved'), 'info')
}

window.showFriendProfile = (friendId) => {
  window.setState?.({ showFriendProfile: true, selectedFriendProfileId: friendId })
}

export default { renderSocial }
