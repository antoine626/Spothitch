/**
 * Social View Component — WhatsApp Style
 * 2 tabs: Messagerie | Événements
 * Orchestrator that delegates to sub-components
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
// renderToggle removed — proximity radar is now "coming soon"
import { escapeHTML } from '../../utils/sanitize.js'
import { formatTime, formatRelativeTime, formatEventDate } from '../../utils/formatters.js'
import { renderConversations } from './social/Conversations.js'
import { renderSkeletonChatList } from '../ui/Skeleton.js'
import { getConversationsList } from '../../services/directMessages.js'
import { getUpcomingEvents, getEventComments, EVENT_TYPES } from '../../services/events.js'
import { getActivityFeed } from '../../services/activityFeed.js'

// Handler for feed visibility toggle (used in radar section onclick)
window.toggleFeedVisibility = async () => {
  const { getState, setState } = await import('../../stores/state.js')
  const { t } = await import('../../i18n/index.js')
  const state = getState()
  const newVal = !state.shareLocationWithFriends
  setState({ shareLocationWithFriends: newVal })
  window.showToast?.(
    newVal ? t('nowVisible') : t('nowInvisible'),
    'info'
  )
}

// ==================== MAIN RENDER ====================

export function renderSocial(state) {
  const mainTab = state.socialSubTab || 'messagerie'

  // Zone chat overlay (full-screen)
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

  // Active DM or group conversation → full-screen chat
  if (state.activeDMConversation || state.activeGroupChat) {
    return `
      <div class="flex flex-col h-[calc(100vh-140px)]">
        ${renderConversations(state)}
      </div>
    `
  }

  // Companion search sub-view
  if (state.showCompanionSearch) {
    return `
      <div class="flex flex-col h-[calc(100vh-140px)]">
        ${renderSocialTabs(mainTab, state)}
        ${renderCompanionSearch(state)}
      </div>
    `
  }

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      ${renderSocialTabs(mainTab, state)}
      ${mainTab === 'evenements'
    ? renderEvenementsTab(state)
    : renderMessagerieTab(state)}
    </div>
  `
}

// ==================== TAB BAR ====================

function renderSocialTabs(activeTab, state) {
  const tabs = [
    {
      id: 'messagerie',
      icon: 'message-circle',
      label: t('socialMessaging') || 'Messagerie',
      badge: state.unreadDMCount || 0,
    },
    {
      id: 'evenements',
      icon: 'calendar',
      label: t('socialEvents') || 'Événements',
      badge: 0,
    },
  ]
  // Normalize legacy tab values
  const currentTab = (activeTab === 'conversations' || activeTab === 'friends' || activeTab === 'feed' || activeTab === 'companion')
    ? 'messagerie'
    : activeTab

  return `
    <div class="flex bg-dark-secondary/50 border-b border-white/5">
      ${tabs.map(tab => `
        <button
          onclick="setSocialTab('${tab.id}')"
          class="flex-1 py-3 px-2 font-medium text-sm transition-colors relative border-b-2 ${
      currentTab === tab.id
        ? 'border-primary-500 text-primary-400'
        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
    }"
        >
          ${icon(tab.icon, 'w-4 h-4 mr-1 inline-block')}
          ${tab.label}
          ${tab.badge > 0 ? `
            <span class="absolute top-1 right-2 w-5 h-5 bg-danger-500 rounded-full text-xs flex items-center justify-center text-white">
              ${tab.badge}
            </span>
          ` : ''}
        </button>
      `).join('')}
    </div>
  `
}

// ==================== TAB 1: MESSAGERIE (WhatsApp Style) ====================

function renderMessagerieTab(state) {
  const friends = state.friends || []
  const onlineFriends = friends.filter(f => f.online)
  const friendRequests = state.friendRequests || []
  const dmConversations = getConversationsList()
  const groups = state.travelGroups || []
  const userId = state.user?.uid || 'local-user'
  const myGroups = groups.filter(g =>
    Array.isArray(g.members) ? g.members.includes(userId) || g.members.some(m => m.id === userId) : false
  )

  // Build unified conversation list
  const allConversations = []
  dmConversations.forEach(conv => {
    allConversations.push({
      type: 'dm', id: conv.recipientId, name: conv.recipientName,
      avatar: conv.recipientAvatar || '🤙', lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime, unreadCount: conv.unreadCount,
      online: conv.online, isGroup: false,
    })
  })
  myGroups.forEach(group => {
    const lastChat = group.chat?.[group.chat.length - 1]
    allConversations.push({
      type: 'group', id: group.id, name: group.name,
      avatar: group.icon || '🚗', lastMessage: lastChat?.text || t('noMessagesYet'),
      lastMessageTime: lastChat?.createdAt || group.createdAt, unreadCount: 0,
      online: false, isGroup: true,
      memberCount: Array.isArray(group.members) ? group.members.length : 0,
    })
  })
  allConversations.sort((a, b) => {
    if (!a.lastMessageTime) return 1
    if (!b.lastMessageTime) return -1
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  })

  if (state.chatLoading) {
    return `<div class="flex-1 overflow-y-auto p-4 space-y-3">${renderSkeletonChatList(6)}</div>`
  }

  return `
    <div class="flex-1 overflow-y-auto relative">
      <!-- Search bar -->
      <div class="px-4 pt-3 pb-2">
        <div class="relative">
          <input
            type="text"
            placeholder="${t('searchConversations') || 'Rechercher...'}"
            class="input-field w-full pl-12 text-sm"
            id="social-search"
            aria-label="${t('searchConversations') || 'Rechercher'}"
          />
          ${icon('search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
        </div>
      </div>

      <!-- Online friends story circles -->
      ${onlineFriends.length > 0 || friends.length > 0 ? `
        <div class="flex gap-3 px-4 py-2 overflow-x-auto scrollbar-none">
          <!-- Add friend circle -->
          <button
            onclick="showAddFriend()"
            class="shrink-0 flex flex-col items-center gap-1"
          >
            <div class="w-14 h-14 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
              ${icon('user-plus', 'w-5 h-5 text-slate-400')}
            </div>
            <span class="text-[10px] text-slate-400 w-14 text-center truncate">${t('addFriend') || 'Ajouter'}</span>
          </button>
          ${friends.slice(0, 12).map(f => `
            <button
              onclick="openConversation('${f.id}')"
              class="shrink-0 flex flex-col items-center gap-1"
            >
              <div class="relative">
                <div class="w-14 h-14 rounded-full ${f.online ? 'bg-gradient-to-br from-primary-400 to-amber-500 p-[2px]' : 'bg-white/10 p-[2px]'}">
                  <div class="w-full h-full rounded-full bg-dark-primary flex items-center justify-center text-2xl">
                    ${f.avatar || '🤙'}
                  </div>
                </div>
                ${f.online ? `<span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-dark-primary bg-emerald-500"></span>` : ''}
              </div>
              <span class="text-[10px] ${f.online ? 'text-white' : 'text-slate-400'} w-14 text-center truncate">${escapeHTML(f.name || '')}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Friend requests -->
      ${friendRequests.length > 0 ? `
        <div class="px-4 pb-2">
          <div class="card p-3 border-primary-500/30 bg-primary-500/5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${icon('user-plus', 'w-4 h-4 text-primary-400')}
                <span class="text-sm font-medium">${t('friendRequests')} (${friendRequests.length})</span>
              </div>
              <button onclick="showAddFriend()" class="text-xs text-primary-400">${t('viewAll') || 'Voir'}</button>
            </div>
            <div class="flex gap-2 mt-2 overflow-x-auto scrollbar-none">
              ${friendRequests.slice(0, 3).map(req => `
                <div class="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                  <span class="text-lg">${req.avatar || '🤙'}</span>
                  <span class="text-xs font-medium truncate max-w-[80px]">${escapeHTML(req.name || '')}</span>
                  <button onclick="acceptFriendRequest('${req.id}')" class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center" aria-label="${t('accept')}">
                    ${icon('check', 'w-3 h-3')}
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Zone chat rooms card -->
      <div class="px-4 pb-2">
        <button
          onclick="openZoneChat()"
          class="card p-3 w-full text-left bg-gradient-to-r from-primary-500/10 to-amber-500/10 border-primary-500/20 hover:border-primary-500/40 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg">
              💬
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">${t('zoneChatRooms')}</div>
              <div class="text-xs text-slate-400">${t('zoneChatRoomsDesc')}</div>
            </div>
            ${icon('chevron-right', 'w-4 h-4 text-slate-400')}
          </div>
        </button>
      </div>

      <!-- Companion travel search card -->
      <div class="px-4 pb-2">
        <button
          onclick="showCompanionSearchView()"
          class="card p-3 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">
              🤝
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">${t('lookingForCompanion')}</div>
              <div class="text-xs text-slate-400">${t('companionDesc')}</div>
            </div>
            ${icon('chevron-right', 'w-4 h-4 text-slate-400')}
          </div>
        </button>
      </div>

      <!-- Conversation list -->
      ${allConversations.length > 0 ? `
        <div class="px-4 pb-1">
          <h4 class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">${t('socialConversations') || 'Messages'}</h4>
        </div>
        ${allConversations.map(conv => `
          <button
            onclick="${conv.isGroup ? `openGroupChat('${conv.id}')` : `openConversation('${conv.id}')`}"
            class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div class="relative shrink-0">
              <span class="text-3xl">${conv.avatar}</span>
              ${conv.isGroup ? `
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500/80 text-white text-[10px] flex items-center justify-center">${conv.memberCount}</span>
              ` : conv.online ? `
                <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-primary bg-emerald-500"></span>
              ` : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-sm truncate">${escapeHTML(conv.name)}</span>
                  ${conv.isGroup ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">${t('group')}</span>` : ''}
                </div>
                <time class="text-xs text-slate-400 shrink-0 ml-2">${formatRelativeTime(conv.lastMessageTime)}</time>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p class="text-xs text-slate-400 truncate">${escapeHTML(conv.lastMessage || '')}</p>
                ${conv.unreadCount > 0 ? `
                  <span class="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0 ml-2">${conv.unreadCount}</span>
                ` : ''}
              </div>
            </div>
          </button>
        `).join('')}
      ` : ''}

      <!-- Create group button -->
      <div class="px-4 py-3">
        <button
          onclick="openCreateTravelGroup()"
          class="card p-3 w-full text-left border-dashed border-2 border-white/15 hover:border-primary-500/40 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
              ${icon('plus', 'w-5 h-5 text-slate-400')}
            </div>
            <div class="text-sm text-slate-400">${t('createTravelGroup')}</div>
          </div>
        </button>
      </div>

      ${allConversations.length === 0 && friends.length === 0 ? `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">💬</span>
          <h3 class="text-lg font-bold mb-2">${t('noConversationsYet')}</h3>
          <p class="text-slate-400 text-sm mb-4">${t('addFriendsToChat')}</p>
          <button onclick="showAddFriend()" class="btn-primary">
            ${icon('user-plus', 'w-5 h-5 mr-1')}
            ${t('addFriend')}
          </button>
        </div>
      ` : ''}

      <!-- FAB: New message -->
      <button
        onclick="showAddFriend()"
        class="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-600 hover:scale-110 transition-colors z-30"
        aria-label="${t('newMessage') || 'Nouveau message'}"
      >
        ${icon('plus', 'w-6 h-6')}
      </button>
    </div>
  `
}

// ==================== TAB 2: ÉVÉNEMENTS ====================

function renderEvenementsTab(state) {
  const eventFilter = state.eventFilter || 'all'
  const allEvents = getUpcomingEvents()
  const userId = state.user?.uid || 'local-user'
  // Filter events
  let filteredEvents = allEvents
  if (eventFilter === 'mine') {
    filteredEvents = allEvents.filter(e => e.participants?.includes(userId) || e.creatorId === userId)
  }

  // Activity feed (for the feed items mixed in)
  const activities = getActivityFeed('all').slice(0, 5)

  return `
    <div class="flex-1 overflow-y-auto relative">
      <!-- Proximity Radar — coming soon -->
      <div class="mx-4 mt-3 mb-2">
        <div class="card p-3 border-white/10 opacity-75">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                ${icon('radar', 'w-5 h-5 text-slate-400')}
              </div>
              <div>
                <div class="text-sm font-medium">${t('proximityRadar')}</div>
                <div class="text-xs text-slate-400">${t('comingSoon') || 'Bientot disponible'}</div>
              </div>
            </div>
            <button onclick="changeTab('profile');setState({profileSubTab:'progression'})" class="text-xs text-amber-400 hover:text-amber-300 transition-colors">${t('roadmapVote') || 'Voter'}</button>
          </div>
        </div>
      </div>

      <!-- Filter pills -->
      <div class="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        ${renderEventFilter('all', eventFilter, t('feedAll') || 'Tous')}
        ${renderEventFilter('nearby', eventFilter, t('feedNearby') || 'Près de moi')}
        ${renderEventFilter('mine', eventFilter, t('myEvents') || 'Mes événements')}
      </div>

      <!-- Events list -->
      <div class="px-4 py-2 space-y-3">
        ${filteredEvents.length > 0 ? filteredEvents.map(event => renderEventCard(event, state)).join('') : ''}

        ${activities.length > 0 && eventFilter === 'all' ? `
          <div class="pt-2">
            <h4 class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">${t('recentActivity') || 'Activité récente'}</h4>
            ${activities.map(activity => renderActivityCard(activity)).join('')}
          </div>
        ` : ''}

        ${filteredEvents.length === 0 && (eventFilter !== 'all' || activities.length === 0) ? `
          <div class="text-center py-16">
            <span class="text-5xl mb-4 block">📅</span>
            <h3 class="text-lg font-bold mb-2">${t('noUpcomingEvents') || 'Aucun événement'}</h3>
            <p class="text-slate-400 text-sm mb-4">${t('createFirstEvent') || 'Crée le premier événement !'}</p>
          </div>
        ` : ''}
      </div>

      <!-- FAB: Create event -->
      <button
        onclick="createEvent()"
        class="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-600 hover:scale-110 transition-colors z-30"
        aria-label="${t('createEvent') || 'Créer un événement'}"
      >
        ${icon('calendar-plus', 'w-6 h-6')}
      </button>
    </div>
  `
}

function renderEventFilter(id, active, label) {
  return `
    <button
      onclick="setEventFilter('${id}')"
      class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
    active === id
      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
  }"
    >
      ${label}
    </button>
  `
}

function renderEventCard(event, state) {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const participantCount = event.participants?.length || 0
  const userId = state.user?.uid || 'local-user'
  const isParticipant = event.participants?.includes(userId)

  return `
    <button
      onclick="openEventDetail('${event.id}')"
      class="card p-4 w-full text-left hover:border-primary-500/50 transition-colors"
    >
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-xl ${typeInfo.bg} flex items-center justify-center shrink-0">
          <span class="text-2xl">${typeInfo.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <div class="font-bold text-sm truncate">${escapeHTML(event.title || '')}</div>
            ${isParticipant ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs shrink-0">${t('joined')}</span>` : ''}
          </div>
          <div class="text-xs text-slate-400">
            ${icon('calendar', 'w-3 h-3 inline-block mr-1')}
            ${formatEventDate(event.date)}${event.time ? ` ${t('at')} ${event.time}` : ''}
          </div>
          ${event.location ? `
            <div class="text-xs text-slate-400 mt-0.5">
              ${icon('map-pin', 'w-3 h-3 inline-block mr-1')}
              ${escapeHTML(event.location)}
            </div>
          ` : ''}
          <div class="flex items-center gap-3 mt-1.5">
            <span class="text-xs text-slate-400">
              ${icon('users', 'w-3 h-3 inline-block mr-1')}
              ${participantCount} ${t('participants')}
            </span>
          </div>
        </div>
      </div>
    </button>
  `
}

function renderActivityCard(activity) {
  const typeConfig = {
    new_spot: { icon: 'map-pin', color: 'text-primary-400', bg: 'bg-primary-500/10' },
    review: { icon: 'star', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    badge: { icon: 'award', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    checkin: { icon: 'map-pin', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    friend_joined: { icon: 'user-plus', color: 'text-primary-400', bg: 'bg-primary-500/10' },
  }
  const cfg = typeConfig[activity.type] || typeConfig.checkin

  return `
    <div class="card p-3 mb-2">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center shrink-0">
          ${activity.userAvatar ? `<span class="text-base">${activity.userAvatar}</span>` : icon(cfg.icon, `w-4 h-4 ${cfg.color}`)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm">
            <span class="font-medium">${escapeHTML(activity.userName || t('traveler'))}</span>
            <span class="text-slate-400"> ${escapeHTML(activity.description || '')}</span>
          </p>
          <time class="text-xs text-slate-400 mt-0.5 block">${formatRelativeTime(activity.timestamp)}</time>
        </div>
      </div>
    </div>
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
      <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
        <button onclick="closeZoneChat()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
          ${icon('arrow-left', 'w-5 h-5')}
        </button>
        <div class="flex-1">
          <div class="font-medium text-sm">${t('zoneChatRooms')}</div>
        </div>
      </div>

      <div class="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        ${rooms.map(room => `
          <button
            onclick="setChatRoom('${room.id}')"
            class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      currentRoom === room.id
        ? 'bg-primary-500 text-white'
        : 'bg-white/5 text-slate-400 hover:bg-white/10'
    }"
          >
            <span>${room.icon}</span> ${room.name}
          </button>
        `).join('')}
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="chat-messages" role="log" aria-live="polite">
        ${state.chatLoading
    ? renderSkeletonChatList(6)
    : messages.length > 0
      ? messages.slice(-50).map(msg => renderZoneMessage(msg, state)).join('')
      : `
            <div class="text-center py-12">
              <span class="text-5xl mb-4 block">💬</span>
              <h3 class="text-lg font-bold mb-2">${t('noChatMessages')}</h3>
              <p class="text-slate-400 text-sm">${t('beFirstToWrite')}</p>
            </div>
          `}
      </div>

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
            ${icon('send', 'w-5 h-5')}
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
      <button onclick="closeCompanionSearch()" class="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
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
              ${icon('send', 'w-5 h-5 mr-1')}
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
            ${icon('message-circle', 'w-4 h-4 mr-1')}
            ${t('contactTraveler')}
          </button>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== EVENT DETAIL (overlay) ====================

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
            ${icon('share-2', 'w-5 h-5')}
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
              ${event.location ? `<div class="flex items-center gap-2 text-slate-300">${icon('map-pin', 'w-5 h-5 text-slate-400')} ${escapeHTML(event.location)}</div>` : ''}
              <div class="flex items-center gap-2 text-slate-300">${icon('users', 'w-5 h-5 text-slate-400')} ${participantCount} ${t('participants')}</div>
              <div class="flex items-center gap-2 text-slate-300">${icon('user', 'w-5 h-5 text-slate-400')} ${t('createdBy')} ${event.creatorAvatar || '🤙'} ${escapeHTML(event.creatorName || '')}</div>
            </div>
            ${event.description ? `<div class="mt-3 pt-3 border-t border-white/10"><p class="text-sm text-slate-300">${escapeHTML(event.description)}</p></div>` : ''}
          </div>

          <div>
            ${isParticipant && !isCreator ? `
              <button onclick="leaveEvent('${event.id}')" class="w-full py-3 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-colors">
                ${icon('log-out', 'w-5 h-5 mr-2')} ${t('leaveEvent')}
              </button>
            ` : !isParticipant ? `
              <button onclick="joinEvent('${event.id}')" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
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
              ${icon('messages-square', 'w-5 h-5 text-primary-400')}
              ${t('commentWall')} (${comments.length})
            </h3>
            <div class="flex gap-2 mb-4">
              <input type="text" class="input-field flex-1" placeholder="${t('writeComment')}" id="event-comment-input" autocomplete="off" onkeydown="if(event.key==='Enter') postEventComment('${event.id}')" />
              <button onclick="postEventComment('${event.id}')" class="btn-primary px-4" aria-label="${t('send')}">
                ${icon('send', 'w-5 h-5')}
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
      <button onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')" class="px-2 py-0.5 rounded-full text-xs ${users.includes(userId) ? 'bg-primary-500/30 text-primary-300' : 'bg-white/10 text-slate-400'} hover:bg-white/20 transition-colors">
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
                ${icon('trash', 'w-4 h-4')}
              </button>
            ` : ''}
          </div>
          <p class="text-sm text-slate-300 mt-1">${escapeHTML(comment.text || '')}</p>
          <div class="flex items-center gap-1 mt-2 flex-wrap">
            ${reactionDisplay}
            ${reactionEmojis.map(emoji => `
              <button onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')" class="px-1.5 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-colors" title="${emoji}">
                ${emoji}
              </button>
            `).join('')}
            <button onclick="toggleReplyInput('${comment.id}')" class="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-colors ml-1">
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
          <button onclick="submitCreateEvent()" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
            ${icon('calendar-plus', 'w-5 h-5 mr-2')}
            ${t('publishEvent')}
          </button>
        </div>
      </div>
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.setSocialTab = (tab) => {
  window.setState?.({ socialSubTab: tab })
}

window.setEventFilter = (filter) => {
  window.setState?.({ eventFilter: filter })
}

window.showCompanionSearchView = () => {
  window.setState?.({ showCompanionSearch: true })
}

window.closeCompanionSearch = () => {
  window.setState?.({ showCompanionSearch: false })
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

  setState({ companionRequests: [newReq, ...requests], showCompanionSearch: false })
  window.showToast?.(t('companionRequestPosted'), 'success')
}

window.openFriendChat = (friendId) => {
  window.setState?.({ socialSubTab: 'messagerie', activeDMConversation: friendId })
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
    userName: state.username || t('me'),
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

window.acceptFriendRequest = async (_requestId) => {
  window.showSuccess?.(t('friendAdded'))
  try {
    const { triggerFriendAddedTip } = await import('../../services/contextualTips.js')
    triggerFriendAddedTip()
  } catch { /* no-op */ }
}

window.declineFriendRequest = (requestId) => {
  const state = window.getState?.()
  if (state?.friendRequests) {
    const updated = state.friendRequests.filter(r => r.id !== requestId)
    window.setState?.({ friendRequests: updated })
  }
  window.showToast?.(t('requestDeclined') || 'Request declined', 'info')
}

window.showAddFriend = () => {
  window.setState?.({ socialSubTab: 'messagerie' })
  setTimeout(() => document.getElementById('friend-search')?.focus() || document.getElementById('social-search')?.focus(), 100)
}

window.addFriendByName = async () => {
  const input = document.getElementById('friend-search') || document.getElementById('social-search')
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
  const rng = crypto.getRandomValues(new Uint32Array(3))
  // Unbiased random: multiply then shift to avoid modulo bias (CodeQL: biased random fix)
  const unbiasedInt = (val, max) => Math.floor((val / 0x100000000) * max)
  const newFriend = {
    id: `friend_${Date.now()}`,
    name,
    avatar: avatars[unbiasedInt(rng[0], avatars.length)],
    level: unbiasedInt(rng[1], 10) + 1,
    online: unbiasedInt(rng[2], 2) === 0,
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

window.showFriendProfile = async (friendId) => {
  window.setState?.({ showFriendProfile: true, selectedFriendProfileId: friendId, friendProfileSocialLinks: null })
  // Fetch social links from Firestore in the background
  try {
    const { getUserProfile } = await import('../../services/firebase.js')
    const result = await getUserProfile(friendId)
    if (result.success && result.profile?.socialLinks) {
      window.setState?.({ friendProfileSocialLinks: result.profile.socialLinks })
    }
  } catch { /* offline or not found — no social links shown */ }
}

export default { renderSocial }
