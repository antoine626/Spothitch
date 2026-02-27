/**
 * Social Feed Component
 * Activity feed from friends + events + proximity radar
 */

import { t } from '../../../i18n/index.js'
import { icon } from '../../../utils/icons.js'
import { renderEmptyState } from '../../EmptyState.js'
// renderToggle removed — proximity radar is now "coming soon"
import { escapeHTML } from '../../../utils/sanitize.js'
import { formatRelativeTime, formatEventDate } from '../../../utils/formatters.js'
import { getActivityFeed } from '../../../services/activityFeed.js'
import { getUpcomingEvents, EVENT_TYPES } from '../../../services/events.js'

export function renderFeed(state) {
  const feedFilter = state.feedFilter || 'all'
  return `
    <div class="flex flex-col flex-1 min-h-0">
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
      <div class="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
        ${renderFeedFilter('all', feedFilter, t('feedAll'))}
        ${renderFeedFilter('friends', feedFilter, t('feedFriends'))}
        ${renderFeedFilter('events', feedFilter, t('feedEvents'))}
        ${renderFeedFilter('nearby', feedFilter, t('feedNearby'))}
      </div>

      <!-- Feed content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        ${renderFeedContent(state, feedFilter)}
      </div>
    </div>
  `
}

function renderFeedFilter(id, active, label) {
  return `
    <button
      onclick="setFeedFilter('${id}')"
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

function renderFeedContent(state, filter) {
  const activities = getActivityFeed(filter)
  const events = filter === 'all' || filter === 'events' ? getUpcomingEvents().slice(0, 3) : []

  // Merge events into feed as "event" type activities
  const feedItems = [...activities]
  if (events.length > 0 && filter !== 'friends' && filter !== 'nearby') {
    events.forEach(evt => {
      feedItems.push({
        id: `event_${evt.id}`,
        type: 'event',
        event: evt,
        timestamp: evt.date || evt.createdAt,
      })
    })
  }

  // Sort by most recent
  feedItems.sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime()
    const tb = new Date(b.timestamp || 0).getTime()
    return tb - ta
  })

  if (feedItems.length === 0) {
    return renderEmptyState('feed')
  }

  return feedItems.map(item => {
    if (item.type === 'event') return renderEventFeedCard(item.event, state)
    return renderActivityCard(item)
  }).join('')
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
    <div class="card p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0">
          ${activity.userAvatar ? `<span class="text-lg">${activity.userAvatar}</span>` : icon(cfg.icon, `w-5 h-5 ${cfg.color}`)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm">
            <span class="font-medium">${escapeHTML(activity.userName || t('traveler'))}</span>
            <span class="text-slate-400"> ${escapeHTML(activity.description || '')}</span>
          </p>
          ${activity.spotName ? `
            <div class="flex items-center gap-1 mt-1 text-xs text-slate-400">
              ${icon('map-pin', 'w-3 h-3')}
              <span>${escapeHTML(activity.spotName)}</span>
            </div>
          ` : ''}
          <time class="text-xs text-slate-400 mt-1 block">${formatRelativeTime(activity.timestamp)}</time>
        </div>
      </div>
    </div>
  `
}

function renderEventFeedCard(event, state) {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup
  const participantCount = event.participants?.length || 0
  const userId = state.user?.uid || 'local-user'
  const isParticipant = event.participants?.includes(userId)

  return `
    <button
      onclick="openEventDetail('${event.id}')"
      class="card p-4 w-full text-left hover:border-primary-500/50 transition-colors"
    >
      <div class="flex items-center gap-1 mb-2 text-xs text-slate-400">
        ${icon('calendar', 'w-3 h-3')}
        <span>${t('feedEvents')}</span>
      </div>
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center shrink-0">
          <span class="text-xl">${typeInfo.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <div class="font-bold text-sm truncate">${escapeHTML(event.title || '')}</div>
            ${isParticipant ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs shrink-0">${t('joined')}</span>` : ''}
          </div>
          <div class="text-xs text-slate-400">
            ${formatEventDate(event.date)}${event.time ? ` ${t('at')} ${event.time}` : ''}
            ${event.location ? ` — ${escapeHTML(event.location)}` : ''}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            ${icon('user', 'w-3 h-3')} ${participantCount} ${t('participants')}
          </div>
        </div>
      </div>
    </button>
  `
}

// Global handlers
window.setFeedFilter = (filter) => {
  window.setState?.({ feedFilter: filter })
}

// STUB: toggleFeedVisibility canonical in Social.js (removed duplicate)

export default { renderFeed }
