/**
 * Conversations Component
 * Unified DMs + travel group chats sorted by last message
 */

import { t } from '../../../i18n/index.js'
import { icon } from '../../../utils/icons.js'
import { escapeHTML } from '../../../utils/sanitize.js'
import { renderSkeletonChatList } from '../../ui/Skeleton.js'
import { getConversationsList, getConversationMessages } from '../../../services/directMessages.js'
import { getTrustBadge } from '../../../services/identityVerification.js'

export function renderConversations(state) {
  // If a DM conversation is open, show it directly
  if (state.activeDMConversation) {
    return renderDMChat(state, state.activeDMConversation)
  }

  // If a group chat is open, show it
  if (state.activeGroupChat) {
    return renderGroupChat(state, state.activeGroupChat)
  }

  return renderConversationList(state)
}

function renderConversationList(state) {
  const dmConversations = getConversationsList()
  const groups = state.travelGroups || []
  const userId = state.user?.uid || 'local-user'
  const myGroups = groups.filter(g =>
    Array.isArray(g.members) ? g.members.includes(userId) || g.members.some(m => m.id === userId) : false
  )

  // Build unified list
  const allConversations = []

  // DMs
  dmConversations.forEach(conv => {
    allConversations.push({
      type: 'dm',
      id: conv.recipientId,
      name: conv.recipientName,
      avatar: conv.recipientAvatar || '🤙',
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount,
      online: conv.online,
      isGroup: false,
    })
  })

  // Groups
  myGroups.forEach(group => {
    const lastChat = group.chat?.[group.chat.length - 1]
    allConversations.push({
      type: 'group',
      id: group.id,
      name: group.name,
      avatar: group.icon || '🚗',
      lastMessage: lastChat?.text || t('noMessagesYet'),
      lastMessageTime: lastChat?.createdAt || group.createdAt,
      unreadCount: 0,
      online: false,
      isGroup: true,
      memberCount: Array.isArray(group.members) ? group.members.length : 0,
      status: group.status,
    })
  })

  // Sort by most recent
  allConversations.sort((a, b) => {
    if (!a.lastMessageTime) return 1
    if (!b.lastMessageTime) return -1
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  })

  if (state.chatLoading) {
    return `<div class="flex-1 overflow-y-auto p-4 space-y-3">${renderSkeletonChatList(6)}</div>`
  }

  return `
    <div class="flex-1 overflow-y-auto">
      <!-- Zone chat rooms (compact) -->
      <div class="px-4 pt-3 pb-1">
        <button
          onclick="openZoneChat()"
          class="card p-3 w-full text-left bg-gradient-to-r from-primary-500/10 to-amber-500/10 border-primary-500/20 hover:border-primary-500/40 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center">
              ${icon('message-circle', 'w-5 h-5 text-primary-400')}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">${t('zoneChatRooms')}</div>
              <div class="text-xs text-slate-400">${t('zoneChatRoomsDesc')}</div>
            </div>
            ${icon('chevron-right', 'w-4 h-4 text-slate-400')}
          </div>
        </button>
      </div>

      <!-- Conversation list -->
      ${allConversations.length > 0 ? `
        ${allConversations.map(conv => `
          <button
            onclick="${conv.isGroup ? `openGroupChat('${conv.id}')` : `openConversation('${conv.id}')`}"
            class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5"
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
          class="card p-3 w-full text-left border-dashed border-2 border-white/15 hover:border-primary-500/40 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
              ${icon('plus', 'w-5 h-5 text-slate-400')}
            </div>
            <div class="text-sm text-slate-400">${t('createTravelGroup')}</div>
          </div>
        </button>
      </div>

      ${allConversations.length === 0 ? `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">💬</span>
          <h3 class="text-lg font-bold mb-2">${t('noConversationsYet')}</h3>
          <p class="text-slate-400 text-sm">${t('addFriendsToChat')}</p>
        </div>
      ` : ''}
    </div>
  `
}

// --- DM Chat View (moved from Social.js) ---
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
      <div class="flex-1 min-w-0" onclick="showFriendProfile('${recipientId}')">
        <div class="font-medium text-sm">${escapeHTML(recipientName)}</div>
        <div class="text-xs text-slate-400">${isOnline ? t('online') : t('offline')}</div>
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
            <p class="text-slate-400 text-sm">${t('startConversation')}</p>
          </div>
        `}
    </div>

    <!-- Input -->
    <div class="p-3 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendDM('${recipientId}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="${t('messageTo')} ${escapeHTML(recipientName)}..."
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

  let content = `<p class="text-sm text-white">${escapeHTML(msg.text || '')}</p>`

  if (msg.type === 'spot_share' && msg.spot) {
    content = `
      <div class="bg-white/10 rounded-lg p-2 mb-1">
        <div class="flex items-center gap-2">
          ${icon('map-pin', 'w-4 h-4 text-primary-400')}
          <div>
            <div class="text-sm font-medium text-white">${escapeHTML(msg.spot.name || '')}</div>
            <div class="text-xs text-slate-400">${escapeHTML(msg.spot.city || '')}, ${escapeHTML(msg.spot.country || '')}</div>
          </div>
        </div>
      </div>
      <p class="text-sm text-white">${escapeHTML(msg.text || '')}</p>
    `
  } else if (msg.type === 'location_share' && msg.location) {
    content = `
      <div class="bg-white/10 rounded-lg p-2 mb-1">
        <div class="flex items-center gap-2">
          ${icon('location-crosshairs', 'w-4 h-4 text-emerald-400')}
          <div class="text-sm text-white">${escapeHTML(msg.location.address || t('sharedPosition'))}</div>
        </div>
      </div>
      <p class="text-sm text-white">${escapeHTML(msg.text || '')}</p>
    `
  }

  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isSent ? 'bg-primary-500/20' : 'bg-white/5'} rounded-2xl px-4 py-2 ${isSent ? 'rounded-br-md' : 'rounded-bl-md'}">
        ${!isSent ? `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">${msg.senderAvatar || '🤙'}</span>
            <span class="text-xs font-medium text-primary-400">${escapeHTML(msg.senderName || t('traveler'))}</span>
          </div>
        ` : ''}
        ${content}
        <time class="text-xs text-slate-400 mt-1 block ${isSent ? 'text-right' : ''}">
          ${formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  `
}

// --- Group chat view ---
function renderGroupChat(state, groupId) {
  const groups = state.travelGroups || []
  const group = groups.find(g => g.id === groupId)
  if (!group) return ''

  const messages = group.chat || []
  const memberCount = Array.isArray(group.members) ? group.members.length : 0

  return `
    <!-- Header -->
    <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
      <button onclick="closeGroupChat()" class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" aria-label="${t('back')}">
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <span class="text-2xl">${group.icon || '🚗'}</span>
      <div class="flex-1 min-w-0" onclick="openTravelGroupDetail('${groupId}')">
        <div class="font-medium text-sm truncate">${escapeHTML(group.name)}</div>
        <div class="text-xs text-slate-400">${memberCount} ${t('members')}</div>
      </div>
    </div>

    <!-- Trip info collapsible -->
    ${group.departure || group.destination ? `
      <div class="px-4 py-2 bg-white/5 border-b border-white/5">
        <div class="flex items-center gap-2 text-xs text-slate-400">
          ${icon('map-pin', 'w-3 h-3 text-primary-400')}
          <span>${escapeHTML(group.departure?.city || '?')} → ${escapeHTML(group.destination?.city || '?')}</span>
          ${group.startDate ? `<span class="ml-auto">${icon('calendar', 'w-3 h-3')} ${group.startDate}</span>` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3" id="group-chat-messages" role="log" aria-live="polite">
      ${messages.length > 0
    ? messages.map(msg => renderGroupMessage(msg, state)).join('')
    : `
          <div class="text-center py-12">
            <span class="text-4xl mb-4 block">🚗</span>
            <p class="text-slate-400 text-sm">${t('startConversation')}</p>
          </div>
        `}
    </div>

    <!-- Input -->
    <div class="p-3 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendGroupChatMessage('${groupId}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="${t('typeMessage')}..."
          id="group-chat-input"
          autocomplete="off"
          aria-label="${t('typeMessage')}"
        />
        <button type="submit" class="btn-primary px-4" aria-label="${t('send')}">
          ${icon('paper-plane', 'w-5 h-5')}
        </button>
      </form>
    </div>
  `
}

function renderGroupMessage(msg, state) {
  const isSent = msg.userId === (state.user?.uid || 'local-user')

  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isSent ? 'bg-primary-500/20' : 'bg-white/5'} rounded-2xl px-4 py-2 ${isSent ? 'rounded-br-md' : 'rounded-bl-md'}">
        ${!isSent ? `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">${msg.userAvatar || '🤙'}</span>
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

// Global handlers
window.openGroupChat = (groupId) => {
  window.setState?.({ activeGroupChat: groupId, socialSubTab: 'conversations' })
}

window.closeGroupChat = () => {
  window.setState?.({ activeGroupChat: null })
}

window.openZoneChat = () => {
  window.setState?.({ showZoneChat: true })
}

window.closeZoneChat = () => {
  window.setState?.({ showZoneChat: false })
}

export default { renderConversations }
