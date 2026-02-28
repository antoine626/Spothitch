/**
 * Admin Panel Modal — Dashboard with 3 tabs: Feedbacks, Errors (Sentry), Tools
 * Feedback analytics from Firebase collection 'feedback'
 * Sentry errors from GitHub Issues (synced via workflow)
 */

import { getState, setState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { escapeHTML } from '../../utils/sanitize.js'

// ==================== FEATURE LIST (mirrors FeedbackPanel.js) ====================
const FEATURES = {
  carte: [
    { id: 'search-city', emoji: '🔍', nameKey: 'fbFeatSearchCity' },
    { id: 'filters', emoji: '⚙️', nameKey: 'fbFeatFilters' },
    { id: 'create-spot', emoji: '📍', nameKey: 'fbFeatCreateSpot' },
    { id: 'route', emoji: '🗺️', nameKey: 'fbFeatRoute' },
    { id: 'gas-stations', emoji: '⛽', nameKey: 'fbFeatGasStations' },
    { id: 'spot-detail', emoji: '📊', nameKey: 'fbFeatSpotDetail' },
    { id: 'offline-map', emoji: '📶', nameKey: 'fbFeatOfflineMap', status: 'coming' },
    { id: 'en-route', emoji: '👁️', nameKey: 'fbFeatEnRoute', status: 'coming' },
    { id: 'city-pages', emoji: '🏙️', nameKey: 'fbFeatCityPages', status: 'coming' },
  ],
  voyage: [
    { id: 'trip-planner', emoji: '🧭', nameKey: 'fbFeatTripPlanner' },
    { id: 'badges', emoji: '🏆', nameKey: 'fbFeatBadges' },
    { id: 'guides', emoji: '📚', nameKey: 'fbFeatGuides' },
    { id: 'challenges', emoji: '🎯', nameKey: 'fbFeatChallenges' },
    { id: 'quiz', emoji: '🧠', nameKey: 'fbFeatQuiz' },
    { id: 'journal', emoji: '📔', nameKey: 'fbFeatJournal', status: 'coming' },
    { id: 'hostels', emoji: '🏨', nameKey: 'fbFeatHostels', status: 'coming' },
    { id: 'leagues', emoji: '🥇', nameKey: 'fbFeatLeagues', status: 'coming' },
  ],
  social: [
    { id: 'friends', emoji: '👫', nameKey: 'fbFeatFriends' },
    { id: 'private-messages', emoji: '💬', nameKey: 'fbFeatPrivateMessages' },
    { id: 'feed', emoji: '📰', nameKey: 'fbFeatFeed' },
    { id: 'companion-route', emoji: '🤝', nameKey: 'fbFeatCompanionRoute' },
    { id: 'events', emoji: '🎉', nameKey: 'fbFeatEvents', status: 'coming' },
    { id: 'groups-races', emoji: '👥', nameKey: 'fbFeatGroupsRaces', status: 'coming' },
  ],
  profil: [
    { id: 'my-profile', emoji: '👤', nameKey: 'fbFeatMyProfile' },
    { id: 'identity-verify', emoji: '🔐', nameKey: 'fbFeatIdentityVerify' },
    { id: 'settings', emoji: '⚙️', nameKey: 'fbFeatSettings' },
    { id: 'thumbs-partners', emoji: '👍', nameKey: 'fbFeatThumbsPartners', status: 'coming' },
    { id: 'tech-improvements', emoji: '🚀', nameKey: 'fbFeatTechImprovements', status: 'coming' },
  ],
  securite: [
    { id: 'sos', emoji: '🆘', nameKey: 'fbFeatSos' },
    { id: 'companion-safety', emoji: '🛡️', nameKey: 'fbFeatCompanionSafety' },
    { id: 'guardian-mode', emoji: '👁️', nameKey: 'fbFeatGuardianMode', status: 'coming' },
  ],
}

const ALL_FEATURES = Object.values(FEATURES).flat()
const FEATURE_BY_ID = {}
ALL_FEATURES.forEach(f => { FEATURE_BY_ID[f.id] = f })

const TAB_NAMES = { carte: 'Carte', voyage: 'Voyage', social: 'Social', profil: 'Profil', securite: 'Sécurité' }

const REACTION_META = {
  like: { emoji: '👍', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  love: { emoji: '❤️', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  bug: { emoji: '🐛', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  idea: { emoji: '💡', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  question: { emoji: '❓', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
}

// ==================== ANALYTICS HELPERS ====================

function computeAnalytics(feedbackDocs, period) {
  let docs = feedbackDocs || []

  // Period filter
  if (period === '7d') {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000
    docs = docs.filter(d => {
      const ts = d.timestamp ? new Date(d.timestamp).getTime() : 0
      return ts >= cutoff
    })
  } else if (period === '30d') {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000
    docs = docs.filter(d => {
      const ts = d.timestamp ? new Date(d.timestamp).getTime() : 0
      return ts >= cutoff
    })
  }

  // KPIs
  const totalFeedbacks = docs.length
  const uniqueUsers = new Set(docs.map(d => d.userId || d.userName || 'anon')).size
  const allReactions = docs.flatMap(d => d.reactions || [])
  const positiveCount = allReactions.filter(r => r === 'like' || r === 'love').length
  const satisfactionPct = allReactions.length > 0 ? Math.round(positiveCount / allReactions.length * 100) : 0
  const bugCount = allReactions.filter(r => r === 'bug').length

  // Reaction totals
  const reactionTotals = { like: 0, love: 0, bug: 0, idea: 0, question: 0 }
  allReactions.forEach(r => { if (reactionTotals[r] !== undefined) reactionTotals[r]++ })
  const totalReactions = allReactions.length

  // Per-feature stats
  const featureStats = {}
  docs.forEach(d => {
    const fid = d.featureId
    if (!fid) return
    if (!featureStats[fid]) {
      featureStats[fid] = { like: 0, love: 0, bug: 0, idea: 0, question: 0, total: 0, comments: [] }
    }
    const fs = featureStats[fid]
    ;(d.reactions || []).forEach(r => { if (fs[r] !== undefined) fs[r]++ })
    fs.total += (d.reactions || []).length
    if (d.comment) {
      fs.comments.push({
        user: d.userName || 'Anonyme',
        text: d.comment,
        date: d.timestamp || '',
        reactions: d.reactions || [],
      })
    }
  })

  // Top liked (like+love)
  const topLiked = Object.entries(featureStats)
    .map(([fid, s]) => ({ fid, score: s.like + s.love, ...s }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Top problems (bug+question)
  const topProblems = Object.entries(featureStats)
    .map(([fid, s]) => ({ fid, score: s.bug + s.question, ...s }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Coming soon most requested (by total feedback count)
  const comingFeatureIds = ALL_FEATURES.filter(f => f.status === 'coming').map(f => f.id)
  const comingRequested = comingFeatureIds
    .map(fid => {
      const docCount = docs.filter(d => d.featureId === fid).length
      const s = featureStats[fid] || { like: 0, love: 0, total: 0 }
      return { fid, docCount, likeScore: s.like + s.love }
    })
    .filter(f => f.docCount > 0)
    .sort((a, b) => b.docCount - a.docCount)

  // Coming soon most loved (by like+love)
  const comingLoved = [...comingRequested]
    .filter(f => f.likeScore > 0)
    .sort((a, b) => b.likeScore - a.likeScore)

  // Recent comments (20 latest)
  const allComments = docs
    .filter(d => d.comment)
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return tb - ta
    })
    .slice(0, 20)

  return {
    totalFeedbacks, uniqueUsers, satisfactionPct, bugCount,
    reactionTotals, totalReactions,
    topLiked, topProblems,
    comingRequested, comingLoved,
    allComments, featureStats,
  }
}

function featureName(fid) {
  const f = FEATURE_BY_ID[fid]
  if (!f) return fid
  return `${f.emoji} ${t(f.nameKey) || fid}`
}

function pctBar(count, total, color) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0
  return `<div class="flex items-center gap-2 mb-1">
    <div class="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
      <div class="h-full rounded-full" style="width:${pct}%;background:${color}"></div>
    </div>
    <span class="text-xs text-slate-300 w-14 text-right">${count} (${pct}%)</span>
  </div>`
}

function dominantReaction(reactions) {
  if (!reactions || reactions.length === 0) return ''
  const counts = {}
  reactions.forEach(r => { counts[r] = (counts[r] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const meta = REACTION_META[top[0]]
  return meta ? `<span class="inline-block px-1.5 py-0.5 rounded text-xs" style="background:${meta.bg};color:${meta.color}">${meta.emoji}</span>` : ''
}

// ==================== RENDER: FEEDBACK TAB ====================

function renderFeedbackTab(state) {
  const data = state.adminFeedbackData
  const period = state.adminFeedbackPeriod || 'all'

  if (!data) {
    return `
      <div class="text-center py-12">
        <div class="text-4xl mb-4">📊</div>
        <p class="text-slate-300 mb-4">${t('adminFbLoadPrompt') || 'Charger les feedbacks depuis Firebase'}</p>
        <button onclick="loadAdminFeedback()" class="btn-primary px-6 py-2">
          ${icon('download', 'w-4 h-4 mr-2')} ${t('adminFbLoad') || 'Charger les feedbacks'}
        </button>
      </div>`
  }

  const a = computeAnalytics(data, period)

  // Period filter buttons
  const periods = [
    { key: 'all', label: t('adminFbAll') || 'Tout' },
    { key: '7d', label: t('adminFb7d') || '7 jours' },
    { key: '30d', label: t('adminFb30d') || '30 jours' },
  ]
  const periodBtns = periods.map(p =>
    `<button onclick="setAdminFeedbackPeriod('${p.key}')" class="px-3 py-1 rounded-full text-xs ${period === p.key ? 'bg-amber-500 text-black font-bold' : 'bg-slate-700 text-slate-300'}">${p.label}</button>`
  ).join('')

  // KPI cards
  const kpiCards = `
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-amber-400">${a.totalFeedbacks}</div>
        <div class="text-xs text-slate-400">${t('adminFbTotalReviews') || 'Avis reçus'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-purple-400">${a.uniqueUsers}</div>
        <div class="text-xs text-slate-400">${t('adminFbUniqueUsers') || 'Utilisateurs uniques'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-emerald-400">${a.satisfactionPct}%</div>
        <div class="text-xs text-slate-400">${t('adminFbSatisfaction') || 'Satisfaction'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-red-400">${a.bugCount}</div>
        <div class="text-xs text-slate-400">${t('adminFbBugsReported') || 'Bugs signalés'}</div>
      </div>
    </div>`

  // Reaction bars
  const reactionBars = Object.entries(REACTION_META).map(([type, meta]) => {
    const count = a.reactionTotals[type] || 0
    return `<div class="flex items-center gap-2 mb-1.5">
      <span class="w-6 text-center">${meta.emoji}</span>
      ${pctBar(count, a.totalReactions, meta.color)}
    </div>`
  }).join('')

  // Top liked
  const topLikedHtml = a.topLiked.length > 0
    ? a.topLiked.map(f => `<div class="flex items-center justify-between py-1.5 px-2 rounded bg-emerald-500/10 mb-1">
        <span class="text-sm">${featureName(f.fid)}</span>
        <span class="text-xs text-emerald-400 font-bold">👍 ${f.score}</span>
      </div>`).join('')
    : `<p class="text-xs text-slate-500 italic">${t('adminFbNoData') || 'Aucune donnée'}</p>`

  // Top problems
  const topProblemsHtml = a.topProblems.length > 0
    ? a.topProblems.map(f => `<div class="flex items-center justify-between py-1.5 px-2 rounded bg-red-500/10 mb-1">
        <span class="text-sm">${featureName(f.fid)}</span>
        <span class="text-xs text-red-400 font-bold">🐛 ${f.score}</span>
      </div>`).join('')
    : `<p class="text-xs text-slate-500 italic">${t('adminFbNoData') || 'Aucune donnée'}</p>`

  // Coming soon requested
  const comingRequestedHtml = a.comingRequested.length > 0
    ? a.comingRequested.map(f => `<div class="flex items-center justify-between py-1.5 px-2 rounded bg-amber-500/10 mb-1">
        <span class="text-sm">${featureName(f.fid)}</span>
        <span class="text-xs text-amber-400 font-bold">${f.docCount} avis</span>
      </div>`).join('')
    : `<p class="text-xs text-slate-500 italic">${t('adminFbNoData') || 'Aucune donnée'}</p>`

  // Coming soon loved
  const comingLovedHtml = a.comingLoved.length > 0
    ? a.comingLoved.map(f => `<div class="flex items-center justify-between py-1.5 px-2 rounded bg-pink-500/10 mb-1">
        <span class="text-sm">${featureName(f.fid)}</span>
        <span class="text-xs text-pink-400 font-bold">❤️ ${f.likeScore}</span>
      </div>`).join('')
    : `<p class="text-xs text-slate-500 italic">${t('adminFbNoData') || 'Aucune donnée'}</p>`

  // Detail per tab (accordion)
  const tabDetailHtml = Object.entries(FEATURES).map(([tabKey, features]) => {
    const featureRows = features.map(feat => {
      const s = a.featureStats[feat.id]
      if (!s || s.total === 0) return ''
      const miniBar = Object.entries(REACTION_META).map(([type, meta]) => {
        const c = s[type] || 0
        if (c === 0) return ''
        return `<span class="inline-block px-1.5 py-0.5 rounded text-xs mr-1" style="background:${meta.bg};color:${meta.color}">${meta.emoji} ${c}</span>`
      }).join('')
      return `<div class="flex items-center justify-between py-1 border-b border-slate-700/50">
        <span class="text-xs">${feat.emoji} ${t(feat.nameKey) || feat.id}</span>
        <div>${miniBar}</div>
      </div>`
    }).filter(Boolean).join('')

    if (!featureRows) return ''

    return `<details class="card p-3 mb-2">
      <summary class="font-bold text-sm cursor-pointer text-slate-200">${TAB_NAMES[tabKey] || tabKey}</summary>
      <div class="mt-2">${featureRows}</div>
    </details>`
  }).join('')

  // Recent comments
  const commentsHtml = a.allComments.length > 0
    ? a.allComments.map(d => {
      const dateStr = d.timestamp ? new Date(d.timestamp).toLocaleDateString() : ''
      const feat = FEATURE_BY_ID[d.featureId]
      const featLabel = feat ? `${feat.emoji} ${t(feat.nameKey) || d.featureId}` : d.featureId
      return `<div class="py-2 border-b border-slate-700/50">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-amber-400">${escapeHTML(d.userName || 'Anonyme')}</span>
          <span class="text-xs text-slate-500">${dateStr}</span>
          <span class="text-xs text-slate-400">${featLabel}</span>
          ${dominantReaction(d.reactions)}
        </div>
        <p class="text-sm text-slate-200">${escapeHTML(d.comment || '')}</p>
      </div>`
    }).join('')
    : `<p class="text-xs text-slate-500 italic">${t('adminFbNoComments') || 'Aucun commentaire'}</p>`

  return `
    <!-- Period Filter -->
    <div class="flex gap-2 mb-4">${periodBtns}</div>

    <!-- KPIs -->
    ${kpiCards}

    <!-- Reaction Distribution -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-slate-200">${t('adminFbReactions') || 'Répartition des réactions'}</h4>
      ${reactionBars}
    </div>

    <!-- Top Liked -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-emerald-400">${t('adminFbTopLiked') || 'Top 5 les plus aimées'}</h4>
      ${topLikedHtml}
    </div>

    <!-- Top Problems -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-red-400">${t('adminFbTopProblems') || 'Top 5 problèmes'}</h4>
      ${topProblemsHtml}
    </div>

    <!-- Coming Soon Requested -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-amber-400">${t('adminFbComingRequested') || 'À venir : les plus demandées'}</h4>
      ${comingRequestedHtml}
    </div>

    <!-- Coming Soon Loved -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-pink-400">${t('adminFbComingLoved') || 'À venir : les plus aimées'}</h4>
      ${comingLovedHtml}
    </div>

    <!-- Detail per Tab -->
    <div class="mb-4">
      <h4 class="text-sm font-bold mb-2 text-slate-200">${t('adminFbDetailByTab') || 'Détail par onglet'}</h4>
      ${tabDetailHtml || `<p class="text-xs text-slate-500 italic">${t('adminFbNoData') || 'Aucune donnée'}</p>`}
    </div>

    <!-- Recent Comments -->
    <div class="card p-3 mb-4">
      <h4 class="text-sm font-bold mb-2 text-slate-200">${t('adminFbRecentComments') || 'Derniers commentaires'}</h4>
      <div class="max-h-60 overflow-y-auto">${commentsHtml}</div>
    </div>

    <!-- Export CSV -->
    <button onclick="exportFeedbackCSV()" class="btn-secondary w-full py-2 text-sm">
      ${icon('download', 'w-4 h-4 mr-2')} ${t('adminFbExportCSV') || 'Exporter CSV'}
    </button>`
}

// ==================== RENDER: SENTRY TAB ====================

function renderSentryTab(state) {
  const issues = state.adminSentryIssues

  if (!issues) {
    return `
      <div class="text-center py-12">
        <div class="text-4xl mb-4">🐛</div>
        <p class="text-slate-300 mb-4">${t('adminSentryLoadPrompt') || 'Charger les erreurs depuis GitHub Issues'}</p>
        <button onclick="loadAdminSentry()" class="btn-primary px-6 py-2">
          ${icon('download', 'w-4 h-4 mr-2')} ${t('adminSentryLoad') || 'Charger les erreurs'}
        </button>
      </div>`
  }

  if (issues.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="text-4xl mb-4">✅</div>
        <p class="text-emerald-400 font-bold">${t('adminSentryNoErrors') || 'Aucune erreur !'}</p>
        <button onclick="loadAdminSentry()" class="btn-secondary px-4 py-1 mt-4 text-sm">
          ${t('adminSentryRefresh') || 'Rafraîchir'}
        </button>
      </div>`
  }

  // KPIs
  const openIssues = issues.filter(i => i.state === 'open')
  const recent24h = issues.filter(i => {
    const ts = i.created_at ? new Date(i.created_at).getTime() : 0
    return ts >= Date.now() - 24 * 3600 * 1000
  })

  const kpiHtml = `
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-red-400">${openIssues.length}</div>
        <div class="text-xs text-slate-400">${t('adminSentryOpen') || 'Non résolues'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-amber-400">${issues.length}</div>
        <div class="text-xs text-slate-400">${t('adminSentryTotal') || 'Total'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl font-bold text-purple-400">${recent24h.length}</div>
        <div class="text-xs text-slate-400">${t('adminSentry24h') || '24h'}</div>
      </div>
    </div>`

  // Issue list
  const issueListHtml = issues.slice(0, 30).map(issue => {
    const dateStr = issue.created_at ? new Date(issue.created_at).toLocaleDateString() : ''
    const isOpen = issue.state === 'open'
    const statusBadge = isOpen
      ? '<span class="inline-block px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Open</span>'
      : '<span class="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Closed</span>'
    const title = escapeHTML(issue.title || 'Sans titre')
    const url = issue.html_url || ''

    return `<div class="py-2 border-b border-slate-700/50">
      <div class="flex items-start gap-2">
        <div class="flex-1">
          <div class="text-sm font-medium text-slate-200">${title}</div>
          <div class="flex items-center gap-2 mt-1">
            ${statusBadge}
            <span class="text-xs text-slate-500">${dateStr}</span>
            <span class="text-xs text-slate-500">#${issue.number || ''}</span>
          </div>
        </div>
        ${url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener" class="text-xs text-amber-400 hover:underline whitespace-nowrap">Sentry →</a>` : ''}
      </div>
    </div>`
  }).join('')

  return `
    ${kpiHtml}

    <div class="card p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-slate-200">${t('adminSentryIssueList') || 'Erreurs récentes'}</h4>
        <button onclick="loadAdminSentry()" class="text-xs text-amber-400 hover:underline">${t('adminSentryRefresh') || 'Rafraîchir'}</button>
      </div>
      <div class="max-h-96 overflow-y-auto">${issueListHtml}</div>
    </div>`
}

// ==================== RENDER: TOOLS TAB (legacy admin) ====================

function renderToolsTab(state) {
  return `
    <!-- Quick Stats -->
    <div class="card p-4 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <div class="grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <div class="font-bold text-amber-400">${state.points || 0}</div>
          <div class="text-xs text-slate-400">${t('points') || 'Pouces'}</div>
        </div>
        <div>
          <div class="font-bold text-emerald-400">${state.level || 1}</div>
          <div class="text-xs text-slate-400">${t('level') || 'Niveau'}</div>
        </div>
        <div>
          <div class="font-bold text-purple-400">${state.skillPoints || 0}</div>
          <div class="text-xs text-slate-400">${t('skillPoints') || 'Skill 👍'}</div>
        </div>
        <div>
          <div class="font-bold text-amber-400">${state.thumbs || 0}</div>
          <div class="text-xs text-slate-400">${t('thumbs') || 'Pouces'}</div>
        </div>
      </div>
    </div>

    <!-- Add Points/Resources -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-amber-400">
        ${icon('coins', 'w-5 h-5 mr-2')}
        ${t('resources') || 'Ressources'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="adminAddPoints(100)" class="btn-secondary text-sm py-2">+100 👍</button>
        <button onclick="adminAddPoints(1000)" class="btn-secondary text-sm py-2">+1000 👍</button>
        <button onclick="adminAddSkillPoints(5)" class="btn-secondary text-sm py-2">+5 Skill 👍</button>
        <button onclick="adminAddThumbs(50)" class="btn-secondary text-sm py-2">+50 Pouces</button>
        <button onclick="adminLevelUp()" class="btn-secondary text-sm py-2">Level Up</button>
        <button onclick="adminMaxStats()" class="btn-primary text-sm py-2">MAX ALL</button>
      </div>
    </div>

    <!-- Gamification -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-purple-400">
        ${icon('gamepad', 'w-5 h-5 mr-2')}
        ${t('gamification') || 'Gamification'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openBadges(); closeAdminPanel();" class="admin-btn">
          ${icon('medal', 'w-5 h-5 text-amber-400')} ${t('badges') || 'Badges'}
        </button>
        <button onclick="openChallenges(); closeAdminPanel();" class="admin-btn">
          ${icon('crosshair', 'w-5 h-5 text-purple-400')} ${t('challenges') || 'Défis'}
        </button>
        <button onclick="openTeamChallenges(); closeAdminPanel();" class="admin-btn">
          ${icon('user-cog', 'w-5 h-5 text-orange-400')} ${t('teamChallenges') || 'Défis Équipe'}
        </button>
        <button onclick="openQuiz(); closeAdminPanel();" class="admin-btn">
          ${icon('brain', 'w-5 h-5 text-amber-400')} ${t('quiz') || 'Quiz'}
        </button>
        <button onclick="openLeaderboard(); closeAdminPanel();" class="admin-btn">
          ${icon('trophy', 'w-5 h-5 text-yellow-400')} ${t('leaderboard') || 'Classement'}
        </button>
      </div>
    </div>

    <!-- Shop & Rewards -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-emerald-400">
        ${icon('store', 'w-5 h-5 mr-2')}
        ${t('shopRewards') || 'Boutique & Récompenses'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openShop(); closeAdminPanel();" class="admin-btn">
          ${icon('shopping-cart', 'w-5 h-5 text-emerald-400')} ${t('shop') || 'Boutique'}
        </button>
        <button onclick="openMyRewards(); closeAdminPanel();" class="admin-btn">
          ${icon('gift', 'w-5 h-5 text-pink-400')} ${t('myRewards') || 'Mes Récompenses'}
        </button>
        <button onclick="openProfileCustomization(); closeAdminPanel();" class="admin-btn">
          ${icon('palette', 'w-5 h-5 text-purple-400')} ${t('customization') || 'Personnalisation'}
        </button>
        <button onclick="openStats(); closeAdminPanel();" class="admin-btn">
          ${icon('chart-bar', 'w-5 h-5 text-amber-400')} ${t('stats') || 'Statistiques'}
        </button>
      </div>
    </div>

    <!-- Social -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-amber-400">
        ${icon('users', 'w-5 h-5 mr-2')}
        ${t('social') || 'Social'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openNearbyFriends(); closeAdminPanel();" class="admin-btn">
          ${icon('map-pin', 'w-5 h-5 text-emerald-400')} ${t('nearbyFriends') || 'Amis Proches'}
        </button>
        <button onclick="openCreateTravelGroup(); closeAdminPanel();" class="admin-btn">
          ${icon('car', 'w-5 h-5 text-purple-400')} ${t('travelGroups') || 'Groupes Voyage'}
        </button>
        <button onclick="changeTab('social'); closeAdminPanel();" class="admin-btn">
          ${icon('messages-square', 'w-5 h-5 text-amber-400')} ${t('chat') || 'Chat'}
        </button>
        <button onclick="openReport(); closeAdminPanel();" class="admin-btn">
          ${icon('flag', 'w-5 h-5 text-red-400')} ${t('report') || 'Signalement'}
        </button>
      </div>
    </div>

    <!-- Map & Spots -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-primary-400">
        ${icon('map-pinned', 'w-5 h-5 mr-2')}
        ${t('mapSpots') || 'Carte & Spots'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openAddSpot(); closeAdminPanel();" class="admin-btn">
          ${icon('circle-plus', 'w-5 h-5 text-emerald-400')} ${t('addSpot') || 'Ajouter Spot'}
        </button>
        <button onclick="openFilters(); closeAdminPanel();" class="admin-btn">
          ${icon('funnel', 'w-5 h-5 text-purple-400')} ${t('filters') || 'Filtres'}
        </button>
        <button onclick="changeTab('travel'); closeAdminPanel();" class="admin-btn">
          ${icon('route', 'w-5 h-5 text-amber-400')} ${t('planner') || 'Planificateur'}
        </button>
        <button onclick="openSOS(); closeAdminPanel();" class="admin-btn">
          ${icon('triangle-alert', 'w-5 h-5 text-red-400')} ${t('sosMode') || 'Mode SOS'}
        </button>
      </div>
    </div>

    <!-- System -->
    <div class="card p-4 mb-4">
      <h3 class="font-bold text-sm mb-3 text-slate-400">
        ${icon('settings', 'w-5 h-5 mr-2')}
        ${t('system') || 'Système'}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openAuth(); closeAdminPanel();" class="admin-btn">
          ${icon('log-in', 'w-5 h-5 text-primary-400')} ${t('login') || 'Connexion'}
        </button>
        <button onclick="startTutorial(); closeAdminPanel();" class="admin-btn">
          ${icon('graduation-cap', 'w-5 h-5 text-amber-400')} ${t('tutorial') || 'Tutoriel'}
        </button>
        <button onclick="openAccessibilityHelp(); closeAdminPanel();" class="admin-btn">
          ${icon('accessibility', 'w-5 h-5 text-amber-400')} ${t('accessibility') || 'Accessibilité'}
        </button>
        <button onclick="openDonation(); closeAdminPanel();" class="admin-btn">
          ${icon('heart', 'w-5 h-5 text-pink-400')} ${t('donation') || 'Donation'}
        </button>
        <button onclick="adminResetState()" class="admin-btn text-red-400">
          ${icon('trash', 'w-5 h-5')} ${t('resetState') || 'Reset State'}
        </button>
        <button onclick="adminExportState()" class="admin-btn">
          ${icon('download', 'w-5 h-5 text-emerald-400')} ${t('exportState') || 'Export State'}
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="card p-4">
      <h3 class="font-bold text-sm mb-3 text-slate-400">
        ${icon('compass', 'w-5 h-5 mr-2')}
        ${t('quickNavigation') || 'Navigation Rapide'}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button onclick="changeTab('map'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30">${t('map') || 'Carte'}</button>
        <button onclick="changeTab('travel'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30">${t('travel') || 'Voyage'}</button>
        <button onclick="changeTab('challenges'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30">${t('challenges') || 'Défis'}</button>
        <button onclick="changeTab('social'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30">${t('social') || 'Social'}</button>
        <button onclick="changeTab('profile'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30">${t('profile') || 'Profil'}</button>
      </div>
    </div>`
}

// ==================== MAIN RENDER ====================

export function renderAdminPanel(state) {
  const activeTab = state.adminActiveTab || 'feedback'

  const tabs = [
    { key: 'feedback', label: t('adminTabFeedback') || 'Feedbacks', emoji: '📊' },
    { key: 'sentry', label: t('adminTabSentry') || 'Erreurs', emoji: '🐛' },
    { key: 'tools', label: t('adminTabTools') || 'Outils', emoji: '⚙️' },
  ]

  const tabBtns = tabs.map(tab =>
    `<button onclick="setAdminTab('${tab.key}')" class="flex-1 py-2 text-sm font-medium rounded-lg ${
      activeTab === tab.key
        ? 'bg-amber-500 text-black'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }">${tab.emoji} ${tab.label}</button>`
  ).join('')

  let tabContent
  if (activeTab === 'feedback') tabContent = renderFeedbackTab(state)
  else if (activeTab === 'sentry') tabContent = renderSentryTab(state)
  else tabContent = renderToolsTab(state)

  return `
    <div class="modal-overlay active" role="dialog" aria-modal="true" onclick="closeAdminPanel()" tabindex="0">
      <div class="modal-content max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            ${icon('shield', 'w-5 h-5 text-amber-400')}
            ${t('adminPanel') || 'Panneau Admin'}
          </h2>
          <button onclick="closeAdminPanel()" class="text-slate-400 hover:text-white">
            ${icon('x', 'w-6 h-6')}
          </button>
        </div>

        <!-- Tab Navigation -->
        <div class="flex gap-1 mb-4 p-1 bg-slate-800 rounded-lg">
          ${tabBtns}
        </div>

        <!-- Tab Content -->
        ${tabContent}
      </div>
    </div>
  `
}

// ==================== HANDLERS ====================

window.openAdminPanel = () => setState({ showAdminPanel: true })
window.closeAdminPanel = () => setState({ showAdminPanel: false })

window.setAdminTab = (tab) => setState({ adminActiveTab: tab })

window.setAdminFeedbackPeriod = (period) => setState({ adminFeedbackPeriod: period })

window.loadAdminFeedback = async () => {
  try {
    window.showToast?.('Chargement...', 'info')
    const { getFirestore, collection, getDocs, query, orderBy } = await import('firebase/firestore')
    const { getApp } = await import('firebase/app')
    const db = getFirestore(getApp())
    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))
    const snapshot = await getDocs(q)
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    setState({ adminFeedbackData: docs })
    window.showToast?.(`${docs.length} feedbacks chargés`, 'success')
  } catch (err) {
    console.error('Error loading feedback:', err)
    window.showToast?.('Erreur chargement feedbacks', 'error')
  }
}

window.loadAdminSentry = async () => {
  try {
    window.showToast?.('Chargement...', 'info')
    const res = await fetch('https://api.github.com/repos/Spothitch/spothitch.github.io/issues?labels=sentry&state=all&per_page=50&sort=created&direction=desc')
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
    const issues = await res.json()
    setState({ adminSentryIssues: issues })
    window.showToast?.(`${issues.length} erreurs chargées`, 'success')
  } catch (err) {
    console.error('Error loading sentry issues:', err)
    // Fallback: try without label filter
    try {
      const res = await fetch('https://api.github.com/repos/Spothitch/spothitch.github.io/issues?state=all&per_page=30&sort=created&direction=desc')
      if (res.ok) {
        const allIssues = await res.json()
        const sentryIssues = allIssues.filter(i =>
          (i.labels || []).some(l => (l.name || '').toLowerCase().includes('sentry'))
        )
        setState({ adminSentryIssues: sentryIssues })
        window.showToast?.(`${sentryIssues.length} erreurs chargées`, 'success')
      } else {
        setState({ adminSentryIssues: [] })
        window.showToast?.('Aucune erreur trouvée', 'info')
      }
    } catch {
      setState({ adminSentryIssues: [] })
      window.showToast?.('API GitHub inaccessible', 'error')
    }
  }
}

window.exportFeedbackCSV = () => {
  const state = getState()
  const data = state.adminFeedbackData
  if (!data || data.length === 0) {
    window.showToast?.('Aucune donnée à exporter', 'error')
    return
  }

  const rows = [['featureId', 'reactions', 'comment', 'userName', 'userId', 'lang', 'timestamp']]
  data.forEach(d => {
    rows.push([
      d.featureId || '',
      (d.reactions || []).join('+'),
      (d.comment || '').replace(/"/g, '""'),
      d.userName || '',
      d.userId || '',
      d.lang || '',
      d.timestamp || '',
    ])
  })

  const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spothitch-feedback-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  window.showToast?.('CSV exporté', 'success')
}

window.adminAddPoints = (amount) => {
  const state = getState()
  setState({
    points: (state.points || 0) + amount,
    totalPoints: (state.totalPoints || 0) + amount
  })
  window.showToast?.(t('pointsAdded')?.replace('{amount}', amount) || `+${amount} 👍 ajoutés`, 'success')
}

window.adminAddSkillPoints = (amount) => {
  const state = getState()
  setState({ skillPoints: (state.skillPoints || 0) + amount })
  window.showToast?.(t('skillPointsAdded')?.replace('{amount}', amount) || `+${amount} skill 👍 ajoutés`, 'success')
}

window.adminAddThumbs = (amount) => {
  const state = getState()
  setState({ thumbs: (state.thumbs || 0) + amount })
  window.showToast?.(t('thumbsAdded')?.replace('{amount}', amount) || `+${amount} pouces ajoutés`, 'success')
}

window.adminLevelUp = () => {
  const state = getState()
  setState({
    level: (state.level || 1) + 1,
    skillPoints: (state.skillPoints || 0) + 3
  })
  window.showToast?.(t('levelReached')?.replace('{level}', (state.level || 1) + 1) || `Niveau ${(state.level || 1) + 1} atteint !`, 'success')
}

window.adminMaxStats = () => {
  setState({
    points: 99999,
    totalPoints: 99999,
    seasonPoints: 5000,
    level: 50,
    skillPoints: 100,
    thumbs: 9999,
    spotsCreated: 50,
    checkins: 100,
    reviewsGiven: 75,
    badges: ['first_spot', 'explorer', 'social', 'veteran', 'helper', 'night_owl', 'early_bird', 'marathon']
  })
  window.showToast?.(t('statsMaxed') || 'Stats maximisées !', 'success')
}

window.adminResetState = () => {
  if (confirm(t('confirmResetState') || 'Réinitialiser toutes les données ?')) {
    localStorage.clear()
    location.reload()
  }
}

window.adminExportState = () => {
  const state = getState()
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spothitch-state-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  window.showToast?.(t('stateExported') || 'State exporté', 'success')
}

// openDonation is defined in DonationCard.js (accepts amount/type params)
// openSOS — canonical in main.js
// openAddSpot — canonical in main.js
// openFilters defined in main.js (canonical)

export default { renderAdminPanel }
