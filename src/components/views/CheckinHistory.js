/**
 * CheckinHistory View Component
 * Shows all user check-ins with filtering and statistics
 */

import { t } from '../../i18n/index.js'
import { getState, setState } from '../../stores/state.js'
import { escapeHTML } from '../../utils/sanitize.js'
import { icon } from '../../utils/icons.js'

/**
 * Get check-in statistics
 */
function getCheckinStats(checkinHistory) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonth = checkinHistory.filter(c => {
    const date = new Date(c.timestamp)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length

  const thisYear = checkinHistory.filter(c => {
    const date = new Date(c.timestamp)
    return date.getFullYear() === currentYear
  }).length

  return {
    total: checkinHistory.length,
    thisMonth,
    thisYear,
  }
}

/**
 * Group check-ins by month/year
 */
function groupCheckinsByMonth(checkinHistory) {
  const groups = {}

  checkinHistory.forEach(checkin => {
    const date = new Date(checkin.timestamp)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    if (!groups[key]) {
      groups[key] = { key, label, checkins: [] }
    }
    groups[key].checkins.push(checkin)
  })

  // Sort groups by date (newest first)
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
}

/**
 * Filter check-ins by period
 */
function filterCheckins(checkinHistory, period) {
  if (period === 'all') return checkinHistory

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  if (period === 'month') {
    return checkinHistory.filter(c => {
      const date = new Date(c.timestamp)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
  }

  if (period === 'year') {
    return checkinHistory.filter(c => {
      const date = new Date(c.timestamp)
      return date.getFullYear() === currentYear
    })
  }

  return checkinHistory
}

/**
 * Format date for display
 */
function formatCheckinDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Render wait time badge
 */
function renderWaitTimeBadge(waitTime) {
  if (waitTime === null || waitTime === undefined) return ''

  const waitLabels = ['< 5 min', '5-15 min', '15-30 min', '> 30 min']
  const waitColors = ['bg-emerald-500/20 text-emerald-400', 'bg-primary-500/20 text-primary-400', 'bg-amber-500/20 text-amber-400', 'bg-danger-500/20 text-danger-400']

  return `
    <span class="px-2 py-0.5 rounded-full text-xs ${waitColors[waitTime] || waitColors[0]}">
      ${icon('clock', 'w-5 h-5 mr-1')}
      ${waitLabels[waitTime] || 'N/A'}
    </span>
  `
}

/**
 * Render rating stars
 */
function renderRatingStars(rating) {
  if (!rating) return ''

  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  let stars = ''
  for (let i = 0; i < fullStars; i++) {
    stars += icon('star', 'w-5 h-5 text-amber-400')
  }
  if (hasHalf) {
    stars += icon('star-half-alt', 'w-5 h-5 text-amber-400')
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += icon('star', 'w-5 h-5 text-slate-600')
  }

  return `<div class="flex items-center gap-0.5 text-sm">${stars}</div>`
}

/**
 * Render a single check-in item
 */
function renderCheckinItem(checkin) {
  const hasPhoto = checkin.photoUrl || checkin.hasPhoto
  const hasComment = checkin.comment && checkin.comment.trim().length > 0

  return `
    <button
      onclick="viewCheckinSpot('${checkin.spotId}')"
      class="w-full text-left card p-4 hover:border-primary-500/50 transition-all"
    >
      <div class="flex gap-3">
        <!-- Photo or placeholder -->
        <div class="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
          ${hasPhoto
    ? `<img src="${checkin.photoUrl}" alt="Photo du check-in" class="w-full h-full object-cover" loading="lazy" />`
    : `<div class="w-full h-full flex items-center justify-center text-2xl">
               ${checkin.spotEmoji || '📍'}
             </div>`
}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Spot name -->
          <div class="font-medium truncate">
            ${escapeHTML(checkin.spotName || 'Spot inconnu')}
          </div>

          <!-- Route -->
          <div class="text-sm text-slate-400 truncate">
            ${escapeHTML(checkin.spotFrom || '?')} ${icon('arrow-right', 'w-3 h-3 mx-1')} ${escapeHTML(checkin.spotTo || '?')}
          </div>

          <!-- Date and badges -->
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span class="text-xs text-slate-500">
              ${formatCheckinDate(checkin.timestamp)}
            </span>
            ${renderWaitTimeBadge(checkin.waitTime)}
            ${hasComment ? `<span class="text-xs text-primary-400">${icon('comment', 'w-5 h-5')}</span>` : ''}
            ${hasPhoto ? `<span class="text-xs text-emerald-400">${icon('camera', 'w-5 h-5')}</span>` : ''}
          </div>

          <!-- Rating -->
          ${checkin.rating ? `
            <div class="mt-1">
              ${renderRatingStars(checkin.rating)}
            </div>
          ` : ''}

          <!-- Comment preview -->
          ${hasComment ? `
            <p class="text-sm text-slate-400 mt-2 line-clamp-2">
              "${escapeHTML(checkin.comment)}"
            </p>
          ` : ''}
        </div>

        <!-- Arrow -->
        <div class="flex items-center text-slate-500">
          ${icon('chevron-right', 'w-5 h-5')}
        </div>
      </div>
    </button>
  `
}

/**
 * Render the CheckinHistory view
 */
export function renderCheckinHistory(state) {
  const checkinHistory = state.checkinHistory || []
  const filterPeriod = state.checkinHistoryFilter || 'all'

  // Get stats before filtering
  const stats = getCheckinStats(checkinHistory)

  // Filter check-ins
  const filteredCheckins = filterCheckins(checkinHistory, filterPeriod)

  // Sort by date (newest first) and group by month
  const sortedCheckins = [...filteredCheckins].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  )
  const groupedCheckins = groupCheckinsByMonth(sortedCheckins)

  // Check if we should load more (infinite scroll)
  const displayLimit = state.checkinDisplayLimit || 20
  const hasMore = sortedCheckins.length > displayLimit

  return `
    <div class="p-4 space-y-4 pb-24 overflow-x-hidden">
      <!-- Header with back button -->
      <div class="flex items-center gap-3">
        <button
          onclick="changeTab('profile')"
          class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          aria-label="${t('backToProfile') || 'Back to profile'}"
        >
          ${icon('arrow-left', 'w-5 h-5')}
        </button>
        <h1 class="text-xl font-bold">${t('myCheckins') || 'My check-ins'}</h1>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-primary-400">${stats.total}</div>
          <div class="text-xs text-slate-400">Total</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">${stats.thisMonth}</div>
          <div class="text-xs text-slate-400">Ce mois-ci</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-purple-400">${stats.thisYear}</div>
          <div class="text-xs text-slate-400">Cette annee</div>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 p-1 bg-dark-secondary rounded-xl">
        <button
          onclick="setCheckinHistoryFilter('all')"
          class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
  filterPeriod === 'all'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          Tout
        </button>
        <button
          onclick="setCheckinHistoryFilter('month')"
          class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
  filterPeriod === 'month'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          Ce mois
        </button>
        <button
          onclick="setCheckinHistoryFilter('year')"
          class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
  filterPeriod === 'year'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          Cette annee
        </button>
      </div>

      <!-- Check-ins list -->
      ${sortedCheckins.length > 0 ? `
        <div class="space-y-4">
          ${groupedCheckins.map(group => {
    // Only show check-ins up to displayLimit
    const groupCheckins = group.checkins.slice(0, displayLimit)
    if (groupCheckins.length === 0) return ''

    return `
              <div class="space-y-3">
                <!-- Month header -->
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                    ${icon('calendar', 'w-5 h-5 text-primary-400')}
                  </div>
                  <h3 class="font-semibold text-slate-300 capitalize">${group.label}</h3>
                  <span class="text-sm text-slate-500">(${group.checkins.length})</span>
                </div>

                <!-- Check-ins in this month -->
                <div class="space-y-3 pl-4 border-l-2 border-white/10">
                  ${groupCheckins.map(checkin => renderCheckinItem(checkin)).join('')}
                </div>
              </div>
            `
  }).join('')}

          <!-- Load more button -->
          ${hasMore ? `
            <button
              onclick="loadMoreCheckins()"
              class="w-full py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
            >
              ${icon('plus', 'w-5 h-5 mr-2')}
              Charger plus (${sortedCheckins.length - displayLimit} restants)
            </button>
          ` : ''}
        </div>
      ` : `
        <!-- Empty state -->
        <div class="card p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            ${icon('map-marker-alt', 'w-8 h-8 text-primary-400')}
          </div>
          <h3 class="font-bold text-lg mb-2">Aucun check-in ${filterPeriod !== 'all' ? 'pour cette periode' : ''}</h3>
          <p class="text-slate-400 text-sm mb-4">
            ${filterPeriod !== 'all'
    ? 'Essayez de changer le filtre ou faites un nouveau check-in !'
    : 'Validez vos passages sur les spots pour construire votre historique.'
}
          </p>
          <button
            onclick="changeTab('map')"
            class="btn-primary"
          >
            ${icon('map', 'w-5 h-5 mr-2')}
            Trouver un spot
          </button>
        </div>
      `}
    </div>
  `
}

// Global handlers
window.setCheckinHistoryFilter = (period) => {
  setState({ checkinHistoryFilter: period, checkinDisplayLimit: 20 })
}

window.loadMoreCheckins = () => {
  const state = getState()
  const currentLimit = state.checkinDisplayLimit || 20
  setState({ checkinDisplayLimit: currentLimit + 20 })
}

window.viewCheckinSpot = (spotId) => {
  const state = getState()
  const spot = state.spots?.find(s => s.id === spotId)

  if (spot) {
    setState({ selectedSpot: spot })
  } else {
    // If spot not found locally, try to navigate to map with spot ID
    window.showToast?.('Spot non trouve localement', 'info')
    window.changeTab?.('map')
  }
}

export default { renderCheckinHistory }
