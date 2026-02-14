/**
 * Social View Component
 * 3 main tabs: Chat | Groupes | Événements
 * Each with sub-sub-tabs (WhatsApp-style)
 */

import { t } from '../../i18n/index.js'
import { renderSkeletonChatList, renderSkeletonFriendCard } from '../ui/Skeleton.js'
import { getTrustBadge } from '../../services/identityVerification.js'
import { getConversationsList, getConversationMessages } from '../../services/directMessages.js'
import { getUpcomingEvents, getEventComments, EVENT_TYPES } from '../../services/events.js'
import { escapeHTML } from '../../utils/sanitize.js'
import { icon } from '../../utils/icons.js'

// ==================== MAIN RENDER ====================

export function renderSocial(state) {
  const mainTab = state.socialSubTab || 'chat'

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <!-- Main tabs (3 tabs, WhatsApp-style) -->
      <div class="flex bg-dark-secondary/50">
        ${renderMainTab('chat', mainTab, 'message-circle', t('socialChat') || 'Chat', state.unreadDMCount)}
        ${renderMainTab('groups', mainTab, 'users', t('socialGroups') || 'Groupes')}
        ${renderMainTab('events', mainTab, 'calendar', t('socialEvents') || 'Événements')}
      </div>

      <!-- Content -->
      ${mainTab === 'chat'
    ? renderChatSection(state)
    : mainTab === 'groups'
      ? renderGroupsSection(state)
      : renderEventsSection(state)}
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

function renderSubSubTabs(tabs, activeTab, handler) {
  return `
    <div class="flex gap-1 p-3 overflow-x-auto scrollbar-none">
      ${tabs.map(tab => `
        <button
          onclick="${handler}('${tab.id}')"
          class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
  activeTab === tab.id
    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
}"
        >
          ${tab.label}
        </button>
      `).join('')}
    </div>
  `
}

// ==================== CHAT SECTION ====================

function renderChatSection(state) {
  const chatTab = state.chatSubTab || 'zones'

  // If a DM conversation is open, show it directly
  if (state.activeDMConversation && chatTab === 'private') {
    return renderDMChat(state, state.activeDMConversation)
  }

  const subTabs = [
    { id: 'zones', label: t('chatZones') || 'Zones' },
    { id: 'private', label: t('chatPrivate') || 'Privé' },
    { id: 'companions', label: t('chatCompanions') || 'Compagnons' },
  ]

  return `
    ${renderSubSubTabs(subTabs, chatTab, 'setChatSubTab')}
    ${chatTab === 'zones'
    ? renderZonesChat(state)
    : chatTab === 'private'
      ? renderPrivateChat(state)
      : renderCompanionSearch(state)}
  `
}

// --- Zones (regional chat rooms) ---
function renderZonesChat(state) {
  const rooms = [
    { id: 'general', name: t('general') || 'Général', icon: '💬' },
    { id: 'europe', name: t('europe') || 'Europe', icon: '🇪🇺' },
    { id: 'help', name: t('help') || 'Aide', icon: '❓' },
    { id: 'meetups', name: t('meetups') || 'Rencontres', icon: '🤝' },
    { id: 'routes', name: t('routes') || 'Itinéraires', icon: '🛣️' },
  ]

  const currentRoom = state.chatRoom || 'general'
  const messages = (state.messages || []).filter(m => !m.room || m.room === currentRoom)

  return `
    <div class="flex flex-col flex-1 min-h-0">
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
              <h3 class="text-lg font-bold mb-2">${t('noChatMessages') || 'Pas encore de messages'}</h3>
              <p class="text-slate-400 text-sm">${t('beFirstToWrite') || 'Sois le premier à écrire !'}</p>
            </div>
          `}
      </div>

      <!-- Input -->
      <div class="p-3 glass-dark">
        <form class="flex gap-2" onsubmit="event.preventDefault(); sendMessage('${currentRoom}');">
          <input
            type="text"
            class="input-field flex-1"
            placeholder="${t('typeMessage') || 'Écris un message...'}"
            id="chat-input"
            autocomplete="off"
            aria-label="${t('typeMessage') || 'Écris un message'}"
          />
          <button type="submit" class="btn-primary px-4" aria-label="${t('send') || 'Envoyer'}">
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
        <time class="text-xs text-slate-500 mt-1 block ${isSent ? 'text-right' : ''}">
          ${formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  `
}

// --- Private (DMs + friends) ---
function renderPrivateChat(state) {
  const friends = state.friends || []
  const friendRequests = state.friendRequests || []
  const conversations = getConversationsList()

  if (state.chatLoading) {
    return `
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        ${renderSkeletonChatList(6)}
      </div>
    `
  }

  return `
    <div class="flex-1 overflow-y-auto">
      <!-- Add friend bar -->
      <div class="p-4 flex gap-2">
        <div class="relative flex-1">
          <input
            type="text"
            placeholder="${t('enterTravelerName') || 'Nom du voyageur...'}"
            class="input-field w-full pl-10"
            id="friend-search"
            aria-label="${t('addFriend') || 'Ajouter un ami'}"
            onkeydown="if(event.key==='Enter') addFriendByName()"
          />
          ${icon('search', 'w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
        </div>
        <button onclick="addFriendByName()" class="btn-primary px-3" aria-label="${t('addFriend')}">
          ${icon('user-plus', 'w-5 h-5')}
        </button>
      </div>

      <!-- Friend Requests -->
      ${friendRequests.length > 0 ? `
        <div class="px-4 pb-3">
          <div class="card p-3 border-primary-500/30">
            <h4 class="font-bold text-xs mb-2 text-primary-400">
              ${icon('user-plus', 'w-4 h-4 mr-1')}
              ${t('friendRequests') || 'Demandes'} (${friendRequests.length})
            </h4>
            ${friendRequests.map(req => `
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">${req.avatar || '🤙'}</span>
                  <span class="text-sm font-medium">${req.name}</span>
                </div>
                <div class="flex gap-1">
                  <button onclick="acceptFriendRequest('${req.id}')" class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center" aria-label="${t('accept')}">
                    ${icon('check', 'w-4 h-4')}
                  </button>
                  <button onclick="declineFriendRequest('${req.id}')" class="w-7 h-7 rounded-full bg-danger-500/20 text-danger-400 flex items-center justify-center" aria-label="${t('decline')}">
                    ${icon('times', 'w-4 h-4')}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Conversations -->
      ${conversations.length > 0 ? `
        ${conversations.map(conv => `
          <button
            onclick="openConversation('${conv.recipientId}')"
            class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5"
          >
            <div class="relative shrink-0">
              <span class="text-3xl">${conv.recipientAvatar || '🤙'}</span>
              ${conv.online ? `<span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-primary bg-emerald-500"></span>` : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="font-medium text-sm truncate">${conv.recipientName}</div>
                <time class="text-xs text-slate-500 shrink-0 ml-2">${formatRelativeTime(conv.lastMessageTime)}</time>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p class="text-xs text-slate-400 truncate">
                  ${conv.lastMessageSenderId === (state.user?.uid || 'local-user') ? `${t('you') || 'Vous'}: ` : ''}${conv.lastMessage}
                </p>
                ${conv.unreadCount > 0 ? `
                  <span class="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0 ml-2">${conv.unreadCount}</span>
                ` : ''}
              </div>
            </div>
          </button>
        `).join('')}
      ` : ''}

      <!-- Online friends (quick access) -->
      ${friends.length > 0 ? `
        <div class="px-4 py-3">
          <h4 class="text-xs text-slate-500 font-medium mb-2">${t('myFriends') || 'Mes amis'} (${friends.length})</h4>
          <div class="space-y-1">
            ${friends.map(friend => `
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                <div class="relative shrink-0">
                  <span class="text-2xl">${friend.avatar || '🤙'}</span>
                  <span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-dark-primary ${friend.online ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium truncate">${friend.name}</span>
                    ${getTrustBadge(friend.verificationLevel || 0)}
                  </div>
                  <span class="text-xs text-slate-500">${friend.online ? t('online') || 'En ligne' : t('offline') || 'Hors ligne'}</span>
                </div>
                <button onclick="openConversation('${friend.id}')" class="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center" aria-label="${t('sendMessage')}">
                  ${icon('comment', 'w-4 h-4')}
                </button>
                <button onclick="showFriendProfile('${friend.id}')" class="w-8 h-8 rounded-full bg-white/5 text-slate-400 flex items-center justify-center" aria-label="${t('viewProfile')}">
                  ${icon('user', 'w-4 h-4')}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">💬</span>
          <h3 class="text-lg font-bold mb-2">${t('noConversationsYet') || 'Pas encore de messages'}</h3>
          <p class="text-slate-400 text-sm">${t('addFriendsToChat') || 'Ajoute des amis pour discuter !'}</p>
        </div>
      `}
    </div>
  `
}

// --- DM Chat View ---
function renderDMChat(state, recipientId) {
  const messages = getConversationMessages(recipientId)
  const friends = state.friends || []
  const friend = friends.find(f => f.id === recipientId)
  const recipientName = friend?.name || t('traveler')
  const recipientAvatar = friend?.avatar || '🤙'
  const isOnline = friend?.online || false

  return `
    <!-- Header -->
    <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
      <button onclick="closeConversation()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <div class="relative">
        <span class="text-2xl">${recipientAvatar}</span>
        ${isOnline ? `<span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-secondary bg-emerald-500"></span>` : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm">${recipientName}</div>
        <div class="text-xs text-slate-400">${isOnline ? t('online') || 'En ligne' : t('offline') || 'Hors ligne'}</div>
      </div>
      <button onclick="shareDMSpot('${recipientId}')" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('shareSpot')}" title="${t('shareSpot')}">
        ${icon('map-pin', 'w-4 h-4')}
      </button>
      <button onclick="shareDMPosition('${recipientId}')" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('sharePosition')}" title="${t('sharePosition')}">
        ${icon('location-crosshairs', 'w-4 h-4')}
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3" id="dm-messages" role="log" aria-live="polite">
      ${messages.length > 0
    ? messages.map(msg => renderDMMessage(msg, state)).join('')
    : `
          <div class="text-center py-12">
            <span class="text-4xl mb-4 block">💬</span>
            <p class="text-slate-400 text-sm">${t('startConversation') || 'Commence la conversation !'}</p>
          </div>
        `}
    </div>

    <!-- Input -->
    <div class="p-3 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendDM('${recipientId}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="${t('messageTo') || 'Message à'} ${recipientName}..."
          id="dm-input"
          autocomplete="off"
          aria-label="${t('writeMessage')}"
        />
        <button type="submit" class="btn-primary px-4" aria-label="${t('send')}">
          ${icon('paper-plane', 'w-5 h-5')}
        </button>
      </form>
    </div>
  `
}

function renderDMMessage(msg, state) {
  const isSent = msg.senderId === (state.user?.uid || 'local-user')

  let content = `<p class="text-sm text-white">${msg.text}</p>`

  if (msg.type === 'spot_share' && msg.spot) {
    content = `
      <div class="bg-white/10 rounded-lg p-2 mb-1">
        <div class="flex items-center gap-2">
          ${icon('map-pin', 'w-4 h-4 text-primary-400')}
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
          ${icon('location-crosshairs', 'w-4 h-4 text-emerald-400')}
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

// --- Companion search ---
function renderCompanionSearch(state) {
  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Create companion request -->
      <div class="card p-5 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('compass', 'w-5 h-5 text-emerald-400')}
          ${t('lookingForCompanion') || 'Cherche compagnon de route'}
        </h3>
        <p class="text-sm text-slate-400 mb-4">${t('companionDesc') || 'Publie ton trajet pour trouver quelqu\'un qui fait la même route.'}</p>
        <div class="space-y-3">
          <div class="flex gap-2">
            <input
              type="text"
              id="companion-from"
              class="input-field flex-1"
              placeholder="${t('from') || 'Départ'}"
            />
            <input
              type="text"
              id="companion-to"
              class="input-field flex-1"
              placeholder="${t('to') || 'Arrivée'}"
            />
          </div>
          <div class="flex gap-2">
            <input
              type="date"
              id="companion-date"
              class="input-field flex-1"
              min="${new Date().toISOString().split('T')[0]}"
            />
            <button onclick="postCompanionRequest()" class="btn-primary px-4">
              ${icon('paper-plane', 'w-5 h-5 mr-1')}
              ${t('publish') || 'Publier'}
            </button>
          </div>
        </div>
      </div>

      <!-- Active requests -->
      ${renderCompanionRequests(state)}

      <!-- Nearby friends widget -->
      <button
        onclick="openNearbyFriends()"
        class="card p-4 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              ${icon('location-dot', 'w-5 h-5 text-emerald-400')}
            </div>
            <div>
              <div class="font-bold text-sm">${t('nearbyFriends') || 'Amis à proximité'}</div>
              <div class="text-xs text-slate-400">${t('seeWhoIsNear') || 'Voir qui est près de toi'}</div>
            </div>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-500')}
        </div>
      </button>
    </div>
  `
}

function renderCompanionRequests(state) {
  const requests = state.companionRequests || []

  if (requests.length === 0) {
    return `
      <div class="text-center py-6">
        <span class="text-4xl mb-3 block">🤝</span>
        <p class="text-sm text-slate-400">${t('noCompanionRequests') || 'Aucune demande pour le moment. Sois le premier !'}</p>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      <h4 class="font-bold text-sm text-slate-400">${t('activeRequests') || 'Demandes actives'}</h4>
      ${requests.map(req => `
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">${req.avatar || '🤙'}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">${req.name}</div>
              <div class="text-xs text-slate-400">${formatRelativeTime(req.createdAt)}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            ${icon('map-pin', 'w-4 h-4 text-primary-400')}
            <span class="text-slate-300">${req.from} → ${req.to}</span>
          </div>
          ${req.date ? `
            <div class="flex items-center gap-2 text-sm mt-1">
              ${icon('calendar', 'w-4 h-4 text-amber-400')}
              <span class="text-slate-400">${formatEventDate(req.date)}</span>
            </div>
          ` : ''}
          <button onclick="openConversation('${req.userId}')" class="mt-3 w-full btn-primary text-sm py-2">
            ${icon('comment', 'w-4 h-4 mr-1')}
            ${t('contactTraveler') || 'Contacter'}
          </button>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== GROUPS SECTION ====================

function renderGroupsSection(state) {
  const groupTab = state.groupSubTab || 'mine'

  const subTabs = [
    { id: 'mine', label: t('myGroups') || 'Mes groupes' },
    { id: 'discover', label: t('discoverGroups') || 'Découvrir' },
  ]

  return `
    ${renderSubSubTabs(subTabs, groupTab, 'setGroupSubTab')}
    ${groupTab === 'mine'
    ? renderMyGroups(state)
    : renderDiscoverGroups(state)}
  `
}

function renderMyGroups(state) {
  const groups = state.travelGroups || []
  const myGroups = groups.filter(g => g.members?.includes(state.user?.uid))

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <!-- Create Group -->
      <button
        onclick="openCreateTravelGroup()"
        class="card p-4 w-full text-left border-dashed border-2 border-white/20 hover:border-primary-500/50 transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
            ${icon('plus', 'w-6 h-6 text-primary-400')}
          </div>
          <div>
            <div class="font-bold">${t('createTravelGroup') || 'Créer un groupe'}</div>
            <div class="text-sm text-slate-400">${t('planTogether') || 'Planifiez votre voyage ensemble'}</div>
          </div>
        </div>
      </button>

      <!-- Groups list -->
      ${myGroups.length > 0 ? `
        <div class="space-y-3">
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
                  <div class="text-sm text-slate-400">${group.members?.length || 0} ${t('members') || 'membres'}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-primary-400">${group.status || t('planning') || 'Planification'}</div>
                  ${icon('chevron-right', 'w-5 h-5 text-slate-500 mt-1')}
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">🚐</span>
          <h3 class="text-lg font-bold mb-2">${t('noGroupYet') || 'Pas encore de groupe'}</h3>
          <p class="text-slate-400 text-sm">${t('createGroupToTravel') || 'Crée un groupe pour voyager ensemble !'}</p>
        </div>
      `}
    </div>
  `
}

function renderDiscoverGroups(state) {
  const groups = state.travelGroups || []
  const publicGroups = groups.filter(g => !g.private && !g.members?.includes(state.user?.uid))

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <!-- Nearby friends -->
      <button
        onclick="openNearbyFriends()"
        class="card p-4 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              ${icon('location-dot', 'w-5 h-5 text-emerald-400')}
            </div>
            <div>
              <div class="font-bold text-sm">${t('nearbyFriends') || 'Amis à proximité'}</div>
              <div class="text-xs text-slate-400">${t('seeWhoIsNear') || 'Voir qui est près de toi'}</div>
            </div>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-500')}
        </div>
      </button>

      <!-- Public groups -->
      ${publicGroups.length > 0 ? `
        <div class="space-y-3">
          <h4 class="font-bold text-sm text-slate-400">${t('publicGroups') || 'Groupes publics'}</h4>
          ${publicGroups.map(group => `
            <div class="card p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <span class="text-2xl">${group.icon || '🚗'}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold truncate">${group.name}</div>
                  <div class="text-sm text-slate-400">${group.members?.length || 0}/${group.maxMembers || 6} ${t('members') || 'membres'}</div>
                </div>
              </div>
              ${group.description ? `<p class="text-sm text-slate-400 mb-3">${group.description}</p>` : ''}
              <button onclick="joinTravelGroupAction('${group.id}')" class="btn-primary w-full py-2 text-sm">
                ${icon('user-plus', 'w-4 h-4 mr-1')}
                ${t('joinGroup') || 'Rejoindre'}
              </button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">🔍</span>
          <h3 class="text-lg font-bold mb-2">${t('noPublicGroups') || 'Aucun groupe public'}</h3>
          <p class="text-slate-400 text-sm">${t('createFirstGroup') || 'Crée le premier groupe !'}</p>
        </div>
      `}
    </div>
  `
}

// ==================== EVENTS SECTION ====================

function renderEventsSection(state) {
  // If event detail or create form is open, show directly
  if (state.selectedEvent) {
    return renderEventDetail(state, state.selectedEvent)
  }
  if (state.showCreateEvent) {
    return renderCreateEventForm(state)
  }

  const eventTab = state.eventSubTab || 'upcoming'

  const subTabs = [
    { id: 'upcoming', label: t('eventsUpcoming') || 'À venir' },
    { id: 'mine', label: t('eventsMine') || 'Mes événements' },
    { id: 'create', label: t('eventsCreate') || 'Créer' },
  ]

  return `
    ${renderSubSubTabs(subTabs, eventTab, 'setEventSubTab')}
    ${eventTab === 'upcoming'
    ? renderUpcomingEvents(state)
    : eventTab === 'mine'
      ? renderMyEvents(state)
      : renderCreateEventForm(state)}
  `
}

function renderUpcomingEvents(state) {
  const events = getUpcomingEvents()

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-3">
      ${events.length > 0
    ? events.map(event => renderEventCard(event, state)).join('')
    : `
          <div class="text-center py-16">
            <span class="text-5xl mb-4 block">📅</span>
            <h3 class="text-lg font-bold mb-2">${t('noEventsYet') || 'Pas d\'événements'}</h3>
            <p class="text-slate-400 text-sm mb-4">${t('noEventsDesc') || 'Sois le premier à créer un événement !'}</p>
            <button onclick="setEventSubTab('create')" class="btn-primary">
              ${icon('plus', 'w-5 h-5 mr-1')}
              ${t('createEvent') || 'Créer un événement'}
            </button>
          </div>
        `}
    </div>
  `
}

function renderMyEvents(state) {
  const events = getUpcomingEvents()
  const userId = state.user?.uid || 'local-user'
  const myEvents = events.filter(e => e.creatorId === userId || e.participants?.includes(userId))

  return `
    <div class="flex-1 overflow-y-auto p-5 space-y-3">
      ${myEvents.length > 0
    ? myEvents.map(event => renderEventCard(event, state)).join('')
    : `
          <div class="text-center py-16">
            <span class="text-5xl mb-4 block">📋</span>
            <h3 class="text-lg font-bold mb-2">${t('noMyEvents') || 'Aucun événement'}</h3>
            <p class="text-slate-400 text-sm">${t('noMyEventsDesc') || 'Tu n\'as rejoint aucun événement pour le moment.'}</p>
          </div>
        `}
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
            ${isParticipant ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs shrink-0">${t('joined') || 'Inscrit'}</span>` : ''}
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <span>${icon('calendar', 'w-4 h-4 mr-1')}${formatEventDate(event.date)}${event.time ? ` ${t('at') || 'à'} ${event.time}` : ''}</span>
          </div>
          ${event.location ? `
            <div class="text-sm text-slate-400 mt-1">${icon('map-marker-alt', 'w-4 h-4 mr-1')}${event.location}</div>
          ` : ''}
          <div class="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>${icon('user', 'w-4 h-4')} ${participantCount} ${t('participants') || 'participants'}</span>
            <span>${event.creatorAvatar || '🤙'} ${event.creatorName}</span>
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
  const topComments = comments.filter(c => !c.replyToId)
  const replies = comments.filter(c => c.replyToId)

  return `
    <div class="flex-1 overflow-y-auto">
      <!-- Header -->
      <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
        <button onclick="closeEventDetail()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
          ${icon('arrow-left', 'w-5 h-5')}
        </button>
        <div class="flex-1"><div class="font-medium text-sm">${t('eventDetail') || 'Détail'}</div></div>
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
        <!-- Info -->
        <div class="card p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-14 h-14 rounded-xl ${typeInfo.bg} flex items-center justify-center">
              <span class="text-3xl">${typeInfo.icon}</span>
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold">${event.title}</h2>
              <div class="text-sm ${typeInfo.color}">${t('eventType_' + event.type) || event.type}</div>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-slate-300">${icon('calendar', 'w-5 h-5 text-slate-400')} ${formatEventDate(event.date)}${event.time ? ` ${t('at') || 'à'} ${event.time}` : ''}</div>
            ${event.location ? `<div class="flex items-center gap-2 text-slate-300">${icon('map-marker-alt', 'w-5 h-5 text-slate-400')} ${event.location}</div>` : ''}
            <div class="flex items-center gap-2 text-slate-300">${icon('users', 'w-5 h-5 text-slate-400')} ${participantCount} ${t('participants') || 'participants'}</div>
            <div class="flex items-center gap-2 text-slate-300">${icon('user', 'w-5 h-5 text-slate-400')} ${t('createdBy') || 'Par'} ${event.creatorAvatar || '🤙'} ${event.creatorName}</div>
          </div>
          ${event.description ? `<div class="mt-3 pt-3 border-t border-white/10"><p class="text-sm text-slate-300">${event.description}</p></div>` : ''}
        </div>

        <!-- Join/Leave -->
        <div>
          ${isParticipant && !isCreator ? `
            <button onclick="leaveEvent('${event.id}')" class="w-full py-3 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-all">
              ${icon('sign-out-alt', 'w-5 h-5 mr-2')} ${t('leaveEvent') || 'Quitter'}
            </button>
          ` : !isParticipant ? `
            <button onclick="joinEvent('${event.id}')" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all">
              ${icon('user-plus', 'w-5 h-5 mr-2')} ${t('joinEvent') || 'Rejoindre'}
            </button>
          ` : `
            <div class="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium text-center">
              ${icon('check', 'w-5 h-5 mr-2')} ${t('youAreOrganizer') || 'Organisateur'}
            </div>
          `}
        </div>

        <!-- Comments -->
        <div class="card p-5">
          <h3 class="font-bold text-sm mb-4 flex items-center gap-2">
            ${icon('comments', 'w-5 h-5 text-primary-400')}
            ${t('commentWall') || 'Commentaires'} (${comments.length})
          </h3>
          <div class="flex gap-2 mb-4">
            <input type="text" class="input-field flex-1" placeholder="${t('writeComment') || 'Écrire un commentaire...'}" id="event-comment-input" autocomplete="off" onkeydown="if(event.key==='Enter') postEventComment('${event.id}')" />
            <button onclick="postEventComment('${event.id}')" class="btn-primary px-4" aria-label="${t('send')}">
              ${icon('paper-plane', 'w-5 h-5')}
            </button>
          </div>
          <div class="space-y-3">
            ${topComments.length > 0
    ? topComments.map(c => renderEventComment(c, replies, event.id, userId)).join('')
    : `<p class="text-slate-500 text-sm text-center py-4">${t('noCommentsYet') || 'Aucun commentaire'}</p>`}
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
            <span class="font-medium text-sm">${comment.userName}</span>
            <time class="text-xs text-slate-500">${formatRelativeTime(comment.createdAt)}</time>
            ${isAuthor ? `
              <button onclick="deleteEventCommentAction('${eventId}', '${comment.id}')" class="text-xs text-slate-500 hover:text-danger-400 ml-auto" aria-label="${t('deleteComment')}">
                ${icon('trash-alt', 'w-4 h-4')}
              </button>
            ` : ''}
          </div>
          <p class="text-sm text-slate-300 mt-1">${comment.text}</p>
          <div class="flex items-center gap-1 mt-2 flex-wrap">
            ${reactionDisplay}
            ${reactionEmojis.map(emoji => `
              <button onclick="reactToEventComment('${eventId}', '${comment.id}', '${emoji}')" class="px-1.5 py-0.5 rounded-full text-xs bg-white/5 text-slate-500 hover:bg-white/10 transition-all" title="${emoji}">
                ${emoji}
              </button>
            `).join('')}
            <button onclick="toggleReplyInput('${comment.id}')" class="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all ml-1">
              ${icon('reply', 'w-4 h-4 mr-1')} ${t('reply') || 'Répondre'}
            </button>
          </div>
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
          <div id="reply-section-${comment.id}" class="hidden mt-2">
            <div class="flex gap-2">
              <input type="text" class="input-field flex-1 text-sm" placeholder="${t('writeReply') || 'Répondre...'}" id="reply-input-${comment.id}" onkeydown="if(event.key==='Enter') replyEventComment('${eventId}', '${comment.id}')" />
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
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <h2 class="text-lg font-bold flex items-center gap-2">
        ${icon('calendar-plus', 'w-5 h-5 text-primary-400')}
        ${t('createEvent') || 'Créer un événement'}
      </h2>

      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventTitle') || 'Titre'} *</label>
          <input type="text" id="event-title" class="input-field w-full" placeholder="${t('eventTitlePlaceholder') || 'Ex: Rencontre autostoppeurs Paris'}" maxlength="80" />
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventType') || 'Type'} *</label>
          <select id="event-type" class="input-field w-full">
            <option value="meetup">${EVENT_TYPES.meetup.icon} ${t('eventType_meetup') || 'Rencontre'}</option>
            <option value="group_departure">${EVENT_TYPES.group_departure.icon} ${t('eventType_group_departure') || 'Départ groupé'}</option>
            <option value="hostel_party">${EVENT_TYPES.hostel_party.icon} ${t('eventType_hostel_party') || 'Soirée auberge'}</option>
            <option value="tips_exchange">${EVENT_TYPES.tips_exchange.icon} ${t('eventType_tips_exchange') || 'Échange de tips'}</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventLocation') || 'Lieu'}</label>
          <input type="text" id="event-location" class="input-field w-full" placeholder="${t('eventLocationPlaceholder') || 'Ex: Paris, Café du Commerce'}" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-sm text-slate-400 mb-1 block">${t('eventDate') || 'Date'} *</label>
            <input type="date" id="event-date" class="input-field w-full" min="${today}" />
          </div>
          <div class="flex-1">
            <label class="text-sm text-slate-400 mb-1 block">${t('eventTime') || 'Heure'}</label>
            <input type="time" id="event-time" class="input-field w-full" />
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventDescription') || 'Description'}</label>
          <textarea id="event-description" class="input-field w-full h-24 resize-none" placeholder="${t('eventDescriptionPlaceholder') || 'Décris ton événement...'}" maxlength="500"></textarea>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-1 block">${t('eventVisibility') || 'Visibilité'}</label>
          <select id="event-visibility" class="input-field w-full">
            <option value="public">${t('publicEvent') || 'Public'}</option>
            <option value="private">${t('friendsOnlyEvent') || 'Amis uniquement'}</option>
          </select>
        </div>
        <button onclick="submitCreateEvent()" class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all">
          ${icon('calendar-plus', 'w-5 h-5 mr-2')}
          ${t('publishEvent') || 'Publier'}
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

    if (diffMins < 1) return t('justNow') || 'À l\'instant'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}${t('daysShort') || 'j'}`
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

window.setChatSubTab = (tab) => {
  window.setState?.({ chatSubTab: tab })
}

window.setGroupSubTab = (tab) => {
  window.setState?.({ groupSubTab: tab })
}

window.setEventSubTab = (tab) => {
  window.setState?.({ eventSubTab: tab })
}

window.postCompanionRequest = async () => {
  const from = document.getElementById('companion-from')?.value?.trim()
  const to = document.getElementById('companion-to')?.value?.trim()
  const date = document.getElementById('companion-date')?.value

  if (!from || !to) {
    window.showToast?.(t('fillFromTo') || 'Remplis le départ et l\'arrivée', 'warning')
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
  window.showToast?.(t('companionRequestPosted') || 'Demande publiée !', 'success')
}

window.openFriendChat = (friendId) => {
  window.setState?.({ socialSubTab: 'chat', chatSubTab: 'private', activeDMConversation: friendId })
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

  try {
    localStorage.setItem('spothitch_messages', JSON.stringify(updatedMessages.slice(-100)))
  } catch (e) { /* quota exceeded */ }

  try {
    const { sendChatMessage } = await import('../../services/firebase.js')
    await sendChatMessage(room, text)
  } catch (e) {
    // Firebase not configured
  }

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
  } catch (e) { /* quota exceeded */ }

  setTimeout(() => {
    const chatEl = document.getElementById('private-messages')
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
  }, 50)
}

window.acceptFriendRequest = async (requestId) => {
  window.showSuccess?.(t('friendAdded') || 'Ami ajouté !')
  try {
    const { triggerFriendAddedTip } = await import('../../services/contextualTips.js')
    triggerFriendAddedTip()
  } catch (e) { /* no-op */ }
}

window.declineFriendRequest = (requestId) => { /* no-op */ }

window.showAddFriend = () => {
  window.setState?.({ socialSubTab: 'chat', chatSubTab: 'private' })
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

  if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    window.showToast?.(t('alreadyFriend') || 'Cet ami est déjà dans ta liste', 'warning')
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
  window.showToast?.(t('friendAdded') || `${name} ajouté à tes amis !`, 'success')
}

window.removeFriend = async (friendId) => {
  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  setState({ friends: (state.friends || []).filter(f => f.id !== friendId) })
  window.showToast?.('Ami retiré', 'info')
}

window.showFriendProfile = (friendId) => {
  window.setState?.({ showFriendProfile: true, selectedFriendProfileId: friendId })
}

export default { renderSocial }
