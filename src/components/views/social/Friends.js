/**
 * Friends Component
 * Friend list + requests + ambassador section
 */

import { t } from '../../../i18n/index.js'
import { icon } from '../../../utils/icons.js'
import { escapeHTML } from '../../../utils/sanitize.js'
import { getTrustBadge } from '../../../services/identityVerification.js'
import { getAmbassadors, searchAmbassadors } from '../../../services/ambassadors.js'

export function renderFriends(state) {
  const friends = state.friends || []
  const friendRequests = state.friendRequests || []
  const ambassadorQuery = state.ambassadorSearchQuery || ''

  return `
    <div class="flex-1 overflow-y-auto">
      <!-- Add friend bar -->
      <div class="p-4 flex gap-2">
        <div class="relative flex-1">
          <input
            type="text"
            placeholder="${t('enterTravelerName')}"
            class="input-field w-full pl-10"
            id="friend-search"
            aria-label="${t('addFriend')}"
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
              ${t('friendRequests')} (${friendRequests.length})
            </h4>
            ${friendRequests.map(req => `
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">${req.avatar || '🤙'}</span>
                  <span class="text-sm font-medium">${escapeHTML(req.name || '')}</span>
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

      <!-- Companion search -->
      <div class="px-4 pb-3">
        <button
          onclick="setSocialSubTab('companion')"
          class="card p-3 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
              ${icon('compass', 'w-5 h-5 text-emerald-400')}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">${t('lookingForCompanion')}</div>
              <div class="text-xs text-slate-400">${t('companionDesc')}</div>
            </div>
            ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
          </div>
        </button>
      </div>

      <!-- Friends list -->
      ${friends.length > 0 ? `
        <div class="px-4 pb-3">
          <h4 class="text-xs text-slate-500 font-medium mb-2">${t('myFriends')} (${friends.length})</h4>
          <div class="space-y-1">
            ${friends.map(friend => `
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                <div class="relative shrink-0">
                  <span class="text-2xl">${friend.avatar || '🤙'}</span>
                  <span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-dark-primary ${friend.online ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium truncate">${escapeHTML(friend.name)}</span>
                    ${getTrustBadge(friend.verificationLevel || 0)}
                  </div>
                  <span class="text-xs text-slate-500">${friend.online ? t('online') : t('offline')}</span>
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
        <div class="text-center py-8 px-4">
          <span class="text-4xl mb-3 block">👥</span>
          <h3 class="text-base font-bold mb-1">${t('noFriendsYet')}</h3>
          <p class="text-slate-400 text-sm">${t('addFriendsToChat')}</p>
        </div>
      `}

      <!-- Ambassadors section -->
      <div class="px-4 py-3 border-t border-white/5">
        <h4 class="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
          ${icon('shield', 'w-4 h-4 text-amber-400')}
          ${t('ambassadors')}
        </h4>

        <!-- Ambassador search -->
        <div class="relative mb-3">
          <input
            type="text"
            placeholder="${t('searchByCity')}"
            class="input-field w-full pl-10 text-sm"
            id="ambassador-search"
            value="${escapeHTML(ambassadorQuery)}"
            oninput="searchAmbassadorsByCity(this.value)"
            aria-label="${t('searchByCity')}"
          />
          ${icon('search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
        </div>

        ${renderAmbassadorList(state)}
      </div>
    </div>
  `
}

function renderAmbassadorList(state) {
  const query = state.ambassadorSearchQuery || ''
  const ambassadors = query ? searchAmbassadors(query) : getAmbassadors().filter(a => a.availability !== 'unavailable').slice(0, 5)

  if (ambassadors.length === 0) {
    return `
      <div class="text-center py-4">
        <p class="text-sm text-slate-400">${query ? t('noAmbassadorsFound') : t('noAmbassadorsAvailable')}</p>
      </div>
    `
  }

  const availabilityConfig = {
    available: { label: t('available'), color: 'text-emerald-400', dot: 'bg-emerald-500' },
    busy: { label: t('busy'), color: 'text-amber-400', dot: 'bg-amber-500' },
    unavailable: { label: t('unavailableStatus'), color: 'text-slate-400', dot: 'bg-slate-500' },
  }

  return `
    <div class="space-y-2">
      ${ambassadors.map(amb => {
    const avail = availabilityConfig[amb.availability] || availabilityConfig.available
    return `
          <div class="card p-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${amb.userAvatar || '🤙'}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium truncate">${escapeHTML(amb.userName)}</span>
                  <span class="w-2 h-2 rounded-full ${avail.dot}"></span>
                </div>
                <div class="text-xs text-slate-400">${escapeHTML(amb.city)}, ${escapeHTML(amb.country)}</div>
              </div>
              <button
                onclick="contactAmbassador('${amb.userId}')"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-medium hover:bg-primary-500/30 transition-all"
              >
                ${icon('comment', 'w-3.5 h-3.5 mr-1')}
                ${t('contact')}
              </button>
            </div>
            ${amb.bio ? `<p class="text-xs text-slate-400 mt-2 line-clamp-2">${escapeHTML(amb.bio)}</p>` : ''}
            ${amb.languages?.length > 0 ? `
              <div class="flex gap-1 mt-2">
                ${amb.languages.map(lang => `
                  <span class="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400">${escapeHTML(lang.toUpperCase())}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `
  }).join('')}
    </div>
  `
}

// Global handlers
window.searchAmbassadorsByCity = (query) => {
  window.setState?.({ ambassadorSearchQuery: query })
}

export default { renderFriends }
