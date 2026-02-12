/**
 * Social View Component
 * 4 sub-tabs: Messages (DM), Friends, Groups, Events
 */

import { t } from '../../i18n/index.js'
import { renderSkeletonChatList, renderSkeletonFriendCard } from '../ui/Skeleton.js'
import { getTrustBadge } from '../../services/identityVerification.js'
import { getConversationsList, getConversationMessages } from '../../services/directMessages.js'
import { getUpcomingEvents, getEventComments, EVENT_TYPES } from '../../services/events.js'

export function renderSocial(state) {
  const activeSubTab = state.socialSubTab || 'messages'

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <!-- Sub-tabs -->
      <div class="flex gap-1 p-4 bg-dark-secondary/50">
        <button
          onclick="setSocialTab('messages')"
          class="flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-all relative ${
  activeSubTab === 'messages'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-envelope mr-1" aria-hidden="true"></i>
          ${t('messagesTab')}
          ${(state.unreadDMCount || 0) > 0 ? `
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full text-xs flex items-center justify-center">
              ${state.unreadDMCount}
            </span>
          ` : ''}
        </button>
        <button
          onclick="setSocialTab('friends')"
          class="flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-all relative ${
  activeSubTab === 'friends'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-user-friends mr-1" aria-hidden="true"></i>
          ${t('friendsTab')}
          ${(state.unreadFriendMessages || 0) > 0 ? `
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full text-xs flex items-center justify-center">
              ${state.unreadFriendMessages}
            </span>
          ` : ''}
        </button>
        <button
          onclick="setSocialTab('groups')"
          class="flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-all ${
  activeSubTab === 'groups'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-users mr-1" aria-hidden="true"></i>
          ${t('groupsTab')}
        </button>
        <button
          onclick="setSocialTab('events')"
          class="flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-all ${
  activeSubTab === 'events'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-calendar-alt mr-1" aria-hidden="true"></i>
          ${t('eventsTab')}
        </button>
      </div>

      <!-- Content -->
      ${activeSubTab === 'messages'
    ? renderMessages(state)
    : activeSubTab === 'friends'
      ? renderFriends(state)
      : activeSubTab === 'groups'
        ? renderTravelGroups(state)
        : renderEvents(state)}
    </div>
  `
}

// ==================== MESSAGES (DM) ====================

function renderMessages(state) {
  // If a conversation is open, show chat view
  if (state.activeDMConversation) {
    return renderDMChat(state, state.activeDMConversation)
  }

  const conversations = getConversationsList()

  if (state.chatLoading) {
    return `
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        ${renderSkeletonChatList(6)}
      </div>
    `
  }

  if (conversations.length === 0) {
    return `
      <div class="flex-1 overflow-y-auto">
        <div class="text-center py-16">
          <span class="text-5xl mb-4 block">💬</span>
          <h3 class="text-lg font-bold mb-2">${t('noConversationsYet')}</h3>
          <p class="text-slate-400 text-sm mb-4">${t('noConversationsDesc')}</p>
          <button
            onclick="setSocialTab('friends')"
            class="btn-primary"
          >
            <i class="fas fa-user-friends mr-2" aria-hidden="true"></i>
            ${t('findFriendsToChat')}
          </button>
        </div>
      </div>
    `
  }

  return `
    <div class="flex-1 overflow-y-auto">
      ${conversations.map(conv => `
        <button
          onclick="openConversation('${conv.recipientId}')"
          class="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5"
        >
          <div class="relative shrink-0">
            <span class="text-3xl">${conv.recipientAvatar || '🤙'}</span>
            ${conv.online ? `
              <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-primary bg-emerald-500"></span>
            ` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="font-medium truncate">${conv.recipientName}</div>
              <time class="text-xs text-slate-500 shrink-0 ml-2">
                ${formatRelativeTime(conv.lastMessageTime)}
              </time>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <p class="text-sm text-slate-400 truncate">
                ${conv.lastMessageSenderId === (state.user?.uid || 'local-user') ? `${t('you')}: ` : ''}${conv.lastMessage}
              </p>
              ${conv.unreadCount > 0 ? `
                <span class="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0 ml-2">
                  ${conv.unreadCount}
                </span>
              ` : ''}
            </div>
          </div>
        </button>
      `).join('')}
    </div>
  `
}

function renderDMChat(state, recipientId) {
  const messages = getConversationMessages(recipientId)
  const friends = state.friends || []
  const friend = friends.find(f => f.id === recipientId)
  const recipientName = friend?.name || t('traveler')
  const recipientAvatar = friend?.avatar || '🤙'
  const isOnline = friend?.online || false

  return `
    <!-- Header -->
    <div class="p-4 bg-dark-secondary/50 flex items-center gap-3">
      <button
        onclick="closeConversation()"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="${t('back')}"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
      </button>
      <div class="relative">
        <span class="text-2xl">${recipientAvatar}</span>
        ${isOnline ? `
          <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-secondary bg-emerald-500"></span>
        ` : ''}
      </div>
      <div class="flex-1">
        <div class="font-medium">${recipientName}</div>
        <div class="text-xs text-slate-400">${isOnline ? t('online') : t('offline')}</div>
      </div>
      <button
        onclick="shareDMSpot('${recipientId}')"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="${t('shareSpot')}"
        title="${t('shareSpot')}"
      >
        <i class="fas fa-map-pin" aria-hidden="true"></i>
      </button>
      <button
        onclick="shareDMPosition('${recipientId}')"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="${t('sharePosition')}"
        title="${t('sharePosition')}"
      >
        <i class="fas fa-location-crosshairs" aria-hidden="true"></i>
      </button>
      <button
        onclick="showFriendProfile('${recipientId}')"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="${t('viewProfile')}"
      >
        <i class="fas fa-user" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-5 space-y-4" id="dm-messages" role="log" aria-live="polite">
      ${messages.length > 0
    ? messages.map(msg => renderDMMessage(msg, state)).join('')
    : `
          <div class="text-center py-12">
            <span class="text-4xl mb-4 block">💬</span>
            <p class="text-slate-400 text-sm">${t('startConversation')}</p>
          </div>
        `
}
    </div>

    <!-- Input -->
    <div class="p-4 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendDM('${recipientId}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="${t('messageTo')} ${recipientName}..."
          id="dm-input"
          autocomplete="off"
          aria-label="${t('writeMessage')}"
        />
        <button
          type="submit"
          class="btn-primary px-4"
          aria-label="${t('send')}"
        >
          <i class="fas fa-paper-plane" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  `
}

function renderDMMessage(msg, state) {
  const isSent = msg.senderId === (state.user?.uid || 'local-user')

  // Special rendering for spot/location shares
  let content = `<p class="text-sm text-white">${msg.text}</p>`

  if (msg.type === 'spot_share' && msg.spot) {
    content = `
      <div class="bg-white/10 rounded-lg p-2 mb-1">
        <div class="flex items-center gap-2">
          <i class="fas fa-map-pin text-primary-400" aria-hidden="true"></i>
          <div>
            <div class="text-sm font-medium text-white">${msg.spot.name || ''}</div>
            <div class="text-xs text-slate-400">${msg.spot.city || ''}, ${msg.spot.country || ''}</div>
          </div>
        </div>
      </div>
      <p class="text-sm text-white">${msg.text}</p>
    `
  } else if (msg.type === 'location_share' && msg.location) {
    content = `
      <div class="bg-white/10 rounded-lg p-2 mb-1">
        <div class="flex items-center gap-2">
          <i class="fas fa-location-crosshairs text-emerald-400" aria-hidden="true"></i>
          <div class="text-sm text-white">${msg.location.address || t('sharedPosition')}</div>
        </div>
      </div>
      <p class="text-sm text-white">${msg.text}</p>
    `
  }

  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isSent ? 'bg-primary-500/20' : 'bg-white/5'} rounded-2xl px-4 py-2 ${isSent ? 'rounded-br-md' : 'rounded-bl-md'}">
        ${!isSent ? `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">${msg.senderAvatar || '🤙'}</span>
            <span class="text-xs font-medium text-primary-400">${msg.senderName || t('traveler')}</span>
          </div>
        ` : ''}
        ${content}
        <time class="text-xs text-slate-500 mt-1 block ${isSent ? 'text-right' : ''}">
          ${formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  `
}

// ==================== FRIENDS ====================

function renderFriends(state) {
  const friends = state.friends || []
  const friendRequests = state.friendRequests || []

  // Show skeleton while loading
  if (state.friendsLoading) {
    return `
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="skeleton h-12 w-full rounded-xl"></div>
        <div class="space-y-2">
          ${Array(5).fill(0).map(() => renderSkeletonFriendCard()).join('')}
        </div>
      </div>
    `
  }

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Add Friend -->
      <div class="space-y-3">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <input
              type="text"
              placeholder="${t('enterTravelerName')}"
              class="input-field w-full pl-10"
              id="friend-search"
              aria-label="${t('addFriend')}"
              onkeydown="if(event.key==='Enter') addFriendByName()"
            />
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          </div>
          <button
            onclick="addFriendByName()"
            class="btn-primary px-4"
            aria-label="${t('addFriend')}"
          >
            <i class="fas fa-user-plus" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Friend Requests -->
      ${friendRequests.length > 0 ? `
        <div class="card p-5 border-primary-500/30">
          <h4 class="font-bold text-sm mb-4 flex items-center gap-2">
            <i class="fas fa-user-plus text-primary-400" aria-hidden="true"></i>
            ${t('friendRequests')} (${friendRequests.length})
          </h4>
          <div class="space-y-3">
            ${friendRequests.map(req => `
              <div class="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${req.avatar || '🤙'}</span>
                  <div>
                    <div class="font-medium">${req.name}</div>
                    <div class="text-xs text-slate-400">${t('level')} ${req.level || 1}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    onclick="acceptFriendRequest('${req.id}')"
                    class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    aria-label="${t('accept')}"
                  >
                    <i class="fas fa-check" aria-hidden="true"></i>
                  </button>
                  <button
                    onclick="declineFriendRequest('${req.id}')"
                    class="w-8 h-8 rounded-full bg-danger-500/20 text-danger-400 hover:bg-danger-500/30"
                    aria-label="${t('decline')}"
                  >
                    <i class="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Friends List -->
      ${friends.length > 0 ? `
        <div class="space-y-2">
          <h4 class="font-bold text-sm text-slate-400 px-1">
            ${t('myFriends')} (${friends.length})
          </h4>
          ${friends.map(friend => `
            <div class="card p-4 flex items-center gap-3">
              <div class="relative">
                <span class="text-3xl">${friend.avatar || '🤙'}</span>
                <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-primary ${
  friend.online ? 'bg-emerald-500' : 'bg-slate-500'
}"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <div class="font-medium truncate">${friend.name}</div>
                  ${getTrustBadge(friend.verificationLevel || 0)}
                </div>
                <div class="text-xs text-slate-400">
                  ${friend.online ? t('online') : t('offline')}
                </div>
              </div>
              <button
                onclick="openConversation('${friend.id}')"
                class="w-9 h-9 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 flex items-center justify-center"
                aria-label="${t('sendMessage')}"
                title="${t('sendMessage')}"
              >
                <i class="fas fa-comment" aria-hidden="true"></i>
              </button>
              <button
                onclick="showFriendProfile('${friend.id}')"
                class="w-9 h-9 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"
                aria-label="${t('viewProfile')}"
                title="${t('viewProfile')}"
              >
                <i class="fas fa-user" aria-hidden="true"></i>
              </button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">👥</span>
          <h3 class="text-lg font-bold mb-2">${t('noFriendsYet')}</h3>
          <p class="text-slate-400 text-sm">${t('addFriendsToTravel')}</p>
          <button
            onclick="showAddFriend()"
            class="btn-primary mt-4"
          >
            <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
            ${t('addFriend')}
          </button>
        </div>
      `}
    </div>
  `
}

// ==================== GROUPS (kept from original) ====================

function renderTravelGroups(state) {
  const groups = state.travelGroups || []
  const myGroups = groups.filter(g => g.members?.includes(state.user?.uid))

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Create Group Button -->
      <button
        onclick="openCreateTravelGroup()"
        class="card p-4 w-full text-left border-dashed border-2 border-white/20 hover:border-primary-500/50 transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <i class="fas fa-plus text-primary-400 text-xl" aria-hidden="true"></i>
          </div>
          <div>
            <div class="font-bold">${t('createTravelGroup')}</div>
            <div class="text-sm text-slate-400">${t('planTogether')}</div>
          </div>
        </div>
      </button>

      <!-- Nearby Friends Widget -->
      <button
        onclick="openNearbyFriends()"
        class="card p-4 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <i class="fas fa-location-dot text-emerald-400 text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <div class="font-bold">${t('nearbyFriends')}</div>
              <div class="text-sm text-slate-400">${t('seeWhoIsNear')}</div>
            </div>
          </div>
          <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
        </div>
      </button>

      <!-- My Groups -->
      ${myGroups.length > 0 ? `
        <div class="space-y-3">
          <h4 class="font-bold text-sm text-slate-400 px-1">${t('myGroups')} (${myGroups.length})</h4>
          ${myGroups.map(group => `
            <button
              onclick="openTravelGroupDetail('${group.id}')"
              class="card p-4 w-full text-left hover:border-primary-500/50 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <span class="text-2xl">${group.icon || '🚗'}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold truncate">${group.name}</div>
                  <div class="text-sm text-slate-400">${group.members?.length || 0} ${t('members')}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-primary-400">${group.status || t('planning')}</div>
                  <i class="fas fa-chevron-right text-slate-500 mt-1" aria-hidden="true"></i>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-8">
          <span class="text-5xl mb-4 block">🚐</span>
          <h3 class="text-lg font-bold mb-2">${t('noGroupYet')}</h3>
          <p class="text-slate-400 text-sm mb-4">${t('createGroupToTravel')}</p>
        </div>
      `}
    </div>
  `
}

// ==================== EVENTS ====================

function renderEvents(state) {
  // If an event is selected, show detail
  if (state.selectedEvent) {
    return renderEventDetail(state, state.selectedEvent)
  }

  // If create form is open, show it
  if (state.showCreateEvent) {
    return renderCreateEventForm(state)
  }

  const events = getUpcomingEvents()

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-5 relative">
      <!-- Events List -->
      ${events.length > 0 ? `
        <div class="space-y-3">
          ${events.map(event => renderEventCard(event, state)).join('')}
        </div>
      ` : `
        <div class="text-center py-16">
          <span class="text-5xl mb-4 block">📅</span>
          <h3 class="text-lg font-bold mb-2">${t('noEventsYet')}</h3>
          <p class="text-slate-400 text-sm mb-4">${t('noEventsDesc')}</p>
        </div>
      `}

      <!-- Floating Create Button -->
      <button
        onclick="createEvent()"
        class="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center z-30"
        aria-label="${t('createEvent')}"
      >
        <i class="fas fa-plus text-xl" aria-hidden="true"></i>
      </button>
    </div>
  `
}

function renderEventCard(event, state) {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const userId = state.user?.uid || 'local-user'
  const isParticipant = event.participants?.includes(userId)
  const participantCount = event.participants?.length || 0

  return `
    <button
      onclick="openEventDetail('${event.id}')"
      class="card p-4 w-full text-left hover:border-primary-500/50 transition-all"
    >
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-xl ${typeInfo.bg} flex items-center justify-center shrink-0">
          <span class="text-2xl">${typeInfo.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <div class="font-bold truncate">${event.title}</div>
            ${isParticipant ? `
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs shrink-0">${t('joined')}</span>
            ` : ''}
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <span>
              <i class="fas fa-calendar mr-1" aria-hidden="true"></i>
              ${formatEventDate(event.date)}${event.time ? ` ${t('at')} ${event.time}` : ''}
            </span>
          </div>
          ${event.location ? `
            <div class="text-sm text-slate-400 mt-1">
              <i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>
              ${event.location}
            </div>
          ` : ''}
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span class="flex items-center gap-1">
                <i class="fas fa-user" aria-hidden="true"></i>
                ${participantCount} ${t('participants')}
              </span>
              <span>${event.creatorAvatar || '🤙'} ${event.creatorName}</span>
            </div>
            ${event.visibility === 'private' ? `
              <span class="text-xs text-slate-500">
                <i class="fas fa-lock" aria-hidden="true"></i>
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    </button>
  `
}

function renderEventDetail(state, event) {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const userId = state.user?.uid || 'local-user'
  const isParticipant = event.participants?.includes(userId)
  const isCreator = event.creatorId === userId
  const participantCount = event.participants?.length || 0
  const comments = getEventComments(event.id)

  // Separate top-level comments from replies
  const topComments = comments.filter(c => !c.replyToId)
  const replies = comments.filter(c => c.replyToId)

  return `
    <div class="flex-1 overflow-y-auto">
      <!-- Header -->
      <div class="p-4 bg-dark-secondary/50 flex items-center gap-3">
        <button
          onclick="closeEventDetail()"
          class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
          aria-label="${t('back')}"
        >
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
        </button>
        <div class="flex-1">
          <div class="font-medium">${t('eventDetail')}</div>
        </div>
        <button
          onclick="shareEvent('${event.id}')"
          class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
          aria-label="${t('share')}"
        >
          <i class="fas fa-share-alt" aria-hidden="true"></i>
        </button>
        ${isCreator ? `
          <button
            onclick="deleteEventAction('${event.id}')"
            class="w-10 h-10 rounded-full bg-danger-500/10 flex items-center justify-center text-danger-400 hover:bg-danger-500/20"
            aria-label="${t('deleteEvent')}"
          >
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        ` : ''}
      </div>

      <div class="p-5 space-y-5">
        <!-- Event Info Card -->
        <div class="card p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-14 h-14 rounded-xl ${typeInfo.bg} flex items-center justify-center">
              <span class="text-3xl">${typeInfo.icon}</span>
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold">${event.title}</h2>
              <div class="text-sm ${typeInfo.color}">${t('eventType_' + event.type)}</div>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <i class="fas fa-calendar w-5 text-center text-slate-400" aria-hidden="true"></i>
              ${formatEventDate(event.date)}${event.time ? ` ${t('at')} ${event.time}` : ''}
            </div>
            ${event.location ? `
              <div class="flex items-center gap-2 text-slate-300">
                <i class="fas fa-map-marker-alt w-5 text-center text-slate-400" aria-hidden="true"></i>
                ${event.location}
              </div>
            ` : ''}
            <div class="flex items-center gap-2 text-slate-300">
              <i class="fas fa-users w-5 text-center text-slate-400" aria-hidden="true"></i>
              ${participantCount} ${t('participants')}
            </div>
            <div class="flex items-center gap-2 text-slate-300">
              <i class="fas fa-user w-5 text-center text-slate-400" aria-hidden="true"></i>
              ${t('createdBy')} ${event.creatorAvatar || '🤙'} ${event.creatorName}
            </div>
            ${event.visibility === 'private' ? `
              <div class="flex items-center gap-2 text-slate-300">
                <i class="fas fa-lock w-5 text-center text-slate-400" aria-hidden="true"></i>
                ${t('privateEvent')}
              </div>
            ` : ''}
          </div>

          ${event.description ? `
            <div class="mt-3 pt-3 border-t border-white/10">
              <p class="text-sm text-slate-300">${event.description}</p>
            </div>
          ` : ''}
        </div>

        <!-- Join / Leave Button -->
        <div>
          ${isParticipant && !isCreator ? `
            <button
              onclick="leaveEvent('${event.id}')"
              class="w-full py-3 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-all"
            >
              <i class="fas fa-sign-out-alt mr-2" aria-hidden="true"></i>
              ${t('leaveEvent')}
            </button>
          ` : !isParticipant ? `
            <button
              onclick="joinEvent('${event.id}')"
              class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all"
            >
              <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
              ${t('joinEvent')}
            </button>
          ` : `
            <div class="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium text-center">
              <i class="fas fa-check mr-2" aria-hidden="true"></i>
              ${t('youAreOrganizer')}
            </div>
          `}
        </div>

        <!-- Comment Wall -->
        <div class="card p-5">
          <h3 class="font-bold text-sm mb-4 flex items-center gap-2">
            <i class="fas fa-comments text-primary-400" aria-hidden="true"></i>
            ${t('commentWall')} (${comments.length})
          </h3>

          <!-- Post Comment -->
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              class="input-field flex-1"
              placeholder="${t('writeComment')}"
              id="event-comment-input"
              autocomplete="off"
              onkeydown="if(event.key==='Enter') postEventComment('${event.id}')"
            />
            <button
              onclick="postEventComment('${event.id}')"
              class="btn-primary px-4"
              aria-label="${t('send')}"
            >
              <i class="fas fa-paper-plane" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Comments List -->
          <div class="space-y-3">
            ${topComments.length > 0
    ? topComments.map(comment => renderEventComment(comment, replies, event.id, userId)).join('')
    : `<p class="text-slate-500 text-sm text-center py-4">${t('noCommentsYet')}</p>`
}
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

  // Build reaction display
  const reactionDisplay = Object.entries(comment.reactions || {})
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => `
      <button
        onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')"
        class="px-2 py-0.5 rounded-full text-xs ${users.includes(userId) ? 'bg-primary-500/30 text-primary-300' : 'bg-white/10 text-slate-400'} hover:bg-white/20 transition-all"
      >
        ${emoji} ${users.length}
      </button>
    `).join('')

  return `
    <div class="bg-white/5 rounded-xl p-3">
      <div class="flex items-start gap-2">
        <span class="text-xl shrink-0">${comment.userAvatar || '🤙'}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm">${comment.userName}</span>
            <time class="text-xs text-slate-500">${formatRelativeTime(comment.createdAt)}</time>
            ${isAuthor ? `
              <button
                onclick="deleteEventCommentAction('${eventId}', '${comment.id}')"
                class="text-xs text-slate-500 hover:text-danger-400 ml-auto"
                aria-label="${t('deleteComment')}"
              >
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
              </button>
            ` : ''}
          </div>
          <p class="text-sm text-slate-300 mt-1">${comment.text}</p>

          <!-- Reactions -->
          <div class="flex items-center gap-1 mt-2 flex-wrap">
            ${reactionDisplay}
            ${reactionEmojis.map(emoji => `
              <button
                onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')"
                class="px-1.5 py-0.5 rounded-full text-xs bg-white/5 text-slate-500 hover:bg-white/10 transition-all"
                title="${emoji}"
              >
                ${emoji}
              </button>
            `).join('')}
            <button
              onclick="toggleReplyInput('${comment.id}')"
              class="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all ml-1"
            >
              <i class="fas fa-reply mr-1" aria-hidden="true"></i>
              ${t('reply')}
            </button>
          </div>

          <!-- Replies -->
          ${commentReplies.length > 0 ? `
            <div class="mt-2 pl-3 border-l-2 border-white/10 space-y-2">
              ${commentReplies.map(reply => `
                <div class="flex items-start gap-2">
                  <span class="text-sm shrink-0">${reply.userAvatar || '🤙'}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-xs">${reply.userName}</span>
                      <time class="text-xs text-slate-500">${formatRelativeTime(reply.createdAt)}</time>
                    </div>
                    <p class="text-xs text-slate-300 mt-0.5">${reply.text}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Reply Input (hidden by default) -->
          <div id="reply-section-${comment.id}" class="hidden mt-2">
            <div class="flex gap-2">
              <input
                type="text"
                class="input-field flex-1 text-sm"
                placeholder="${t('writeReply')}"
                id="reply-input-${comment.id}"
                onkeydown="if(event.key==='Enter') replyEventComment('${eventId}', '${comment.id}')"
              />
              <button
                onclick="replyEventComment('${eventId}', '${comment.id}')"
                class="btn-primary px-3 text-sm"
                aria-label="${t('send')}"
              >
                <i class="fas fa-reply" aria-hidden="true"></i>
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
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <button
          onclick="closeCreateEvent()"
          class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
          aria-label="${t('back')}"
        >
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
        </button>
        <h2 class="text-lg font-bold">${t('createEvent')}</h2>
      </div>

      <div class="space-y-4">
        <!-- Title -->
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventTitle')} *</label>
          <input
            type="text"
            id="event-title"
            class="input-field w-full"
            placeholder="${t('eventTitlePlaceholder')}"
            maxlength="80"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventType')} *</label>
          <select id="event-type" class="input-field w-full">
            <option value="meetup">${EVENT_TYPES.meetup.icon} ${t('eventType_meetup')}</option>
            <option value="group_departure">${EVENT_TYPES.group_departure.icon} ${t('eventType_group_departure')}</option>
            <option value="hostel_party">${EVENT_TYPES.hostel_party.icon} ${t('eventType_hostel_party')}</option>
            <option value="tips_exchange">${EVENT_TYPES.tips_exchange.icon} ${t('eventType_tips_exchange')}</option>
          </select>
        </div>

        <!-- Location -->
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventLocation')}</label>
          <input
            type="text"
            id="event-location"
            class="input-field w-full"
            placeholder="${t('eventLocationPlaceholder')}"
          />
        </div>

        <!-- Date & Time -->
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-sm text-slate-400 mb-1 block">${t('eventDate')} *</label>
            <input
              type="date"
              id="event-date"
              class="input-field w-full"
              min="${today}"
            />
          </div>
          <div class="flex-1">
            <label class="text-sm text-slate-400 mb-1 block">${t('eventTime')}</label>
            <input
              type="time"
              id="event-time"
              class="input-field w-full"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventDescription')}</label>
          <textarea
            id="event-description"
            class="input-field w-full h-24 resize-none"
            placeholder="${t('eventDescriptionPlaceholder')}"
            maxlength="500"
          ></textarea>
        </div>

        <!-- Visibility -->
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventVisibility')}</label>
          <select id="event-visibility" class="input-field w-full">
            <option value="public">${t('publicEvent')}</option>
            <option value="private">${t('friendsOnlyEvent')}</option>
          </select>
        </div>

        <!-- Submit -->
        <button
          onclick="submitCreateEvent()"
          class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all"
        >
          <i class="fas fa-calendar-plus mr-2" aria-hidden="true"></i>
          ${t('publishEvent')}
        </button>
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

window.openFriendChat = (friendId) => {
  // Redirect to DM conversation
  window.setState?.({ socialSubTab: 'messages', activeDMConversation: friendId })
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
    userName: state.username || t('traveler') || 'Voyageur',
    userAvatar: state.avatar || '🤙',
    userId: state.user?.uid || 'local-user',
    createdAt: new Date().toISOString(),
  }

  const updatedMessages = [...messages, newMsg]
  setState({ messages: updatedMessages })

  // Persist to localStorage
  try {
    localStorage.setItem('spothitch_messages', JSON.stringify(updatedMessages.slice(-100)))
  } catch (e) { /* quota exceeded */ }

  // Try Firebase too (non-blocking)
  try {
    const { sendChatMessage } = await import('../../services/firebase.js')
    await sendChatMessage(room, text)
  } catch (e) {
    // Firebase not configured - local only
  }

  // Scroll to bottom
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

  // Persist to localStorage
  try {
    localStorage.setItem('spothitch_private_messages', JSON.stringify(updatedPrivateMessages))
  } catch (e) { /* quota exceeded */ }

  // Scroll to bottom
  setTimeout(() => {
    const chatEl = document.getElementById('private-messages')
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
  }, 50)
}

window.acceptFriendRequest = async (requestId) => {
  window.showSuccess?.(t('friendAdded') || 'Ami ajoute !')

  try {
    const { triggerFriendAddedTip } = await import('../../services/contextualTips.js')
    triggerFriendAddedTip()
  } catch (e) {
    // Silently fail if tips service not available
  }
}

window.declineFriendRequest = (requestId) => {
  /* no-op */
}

window.showAddFriend = () => {
  window.setState?.({ socialSubTab: 'friends' })
  setTimeout(() => document.getElementById('friend-search')?.focus(), 100)
}

window.addFriendByName = async () => {
  const input = document.getElementById('friend-search')
  const name = input?.value?.trim()
  if (!name) {
    window.showToast?.(t('enterTravelerName') || 'Entre un nom de voyageur', 'warning')
    return
  }

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const friends = state.friends || []

  // Check duplicate
  if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    window.showToast?.(t('alreadyFriend') || 'Cet ami est deja dans ta liste', 'warning')
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
  window.showToast?.(t('friendAdded') || `${name} ajoute a tes amis !`, 'success')
}

window.removeFriend = async (friendId) => {
  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  setState({ friends: (state.friends || []).filter(f => f.id !== friendId) })
  window.showToast?.('Ami retire', 'info')
}

window.showFriendProfile = (friendId) => {
  window.setState?.({ showFriendProfile: true, selectedFriendProfileId: friendId })
}

export default { renderSocial }
