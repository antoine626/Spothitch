/**
 * Feedback Panel — Side sliding panel for user feedback on features
 * Design: matches design-mockups/feedback6-final.html exactly
 * 31 features organized by 5 tabs, multi-select reactions, Firebase sync
 */

import { getState, setState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { escapeHTML, escapeJSString } from '../../utils/sanitize.js'

// ==================== FEATURE DEFINITIONS ====================
// IDs are stable — never change after deploy (stored in localStorage/Firebase)

const FEATURES = {
  carte: [
    { id: 'search-city', emoji: '🔍', nameKey: 'fbFeatSearchCity', descKey: 'fbDescSearchCity', longDescKey: 'fbLongSearchCity', status: 'available' },
    { id: 'filters', emoji: '⚙️', nameKey: 'fbFeatFilters', descKey: 'fbDescFilters', longDescKey: 'fbLongFilters', status: 'available' },
    { id: 'create-spot', emoji: '📍', nameKey: 'fbFeatCreateSpot', descKey: 'fbDescCreateSpot', longDescKey: 'fbLongCreateSpot', status: 'available' },
    { id: 'route', emoji: '🗺️', nameKey: 'fbFeatRoute', descKey: 'fbDescRoute', longDescKey: 'fbLongRoute', status: 'available' },
    { id: 'gas-stations', emoji: '⛽', nameKey: 'fbFeatGasStations', descKey: 'fbDescGasStations', longDescKey: 'fbLongGasStations', status: 'available' },
    { id: 'spot-detail', emoji: '📊', nameKey: 'fbFeatSpotDetail', descKey: 'fbDescSpotDetail', longDescKey: 'fbLongSpotDetail', status: 'available' },
    { id: 'offline-map', emoji: '📶', nameKey: 'fbFeatOfflineMap', descKey: 'fbDescOfflineMap', longDescKey: 'fbLongOfflineMap', status: 'coming' },
    { id: 'en-route', emoji: '👁️', nameKey: 'fbFeatEnRoute', descKey: 'fbDescEnRoute', longDescKey: 'fbLongEnRoute', status: 'coming' },
    { id: 'city-pages', emoji: '🏙️', nameKey: 'fbFeatCityPages', descKey: 'fbDescCityPages', longDescKey: 'fbLongCityPages', status: 'coming' },
  ],
  voyage: [
    { id: 'trip-planner', emoji: '🧭', nameKey: 'fbFeatTripPlanner', descKey: 'fbDescTripPlanner', longDescKey: 'fbLongTripPlanner', status: 'available' },
    { id: 'badges', emoji: '🏆', nameKey: 'fbFeatBadges', descKey: 'fbDescBadges', longDescKey: 'fbLongBadges', status: 'available' },
    { id: 'guides', emoji: '📚', nameKey: 'fbFeatGuides', descKey: 'fbDescGuides', longDescKey: 'fbLongGuides', status: 'available' },
    { id: 'challenges', emoji: '🎯', nameKey: 'fbFeatChallenges', descKey: 'fbDescChallenges', longDescKey: 'fbLongChallenges', status: 'available' },
    { id: 'quiz', emoji: '🧠', nameKey: 'fbFeatQuiz', descKey: 'fbDescQuiz', longDescKey: 'fbLongQuiz', status: 'available' },
    { id: 'journal', emoji: '📔', nameKey: 'fbFeatJournal', descKey: 'fbDescJournal', longDescKey: 'fbLongJournal', status: 'coming' },
    { id: 'hostels', emoji: '🏨', nameKey: 'fbFeatHostels', descKey: 'fbDescHostels', longDescKey: 'fbLongHostels', status: 'coming' },
    { id: 'leagues', emoji: '🥇', nameKey: 'fbFeatLeagues', descKey: 'fbDescLeagues', longDescKey: 'fbLongLeagues', status: 'coming' },
  ],
  social: [
    { id: 'friends', emoji: '👫', nameKey: 'fbFeatFriends', descKey: 'fbDescFriends', longDescKey: 'fbLongFriends', status: 'available' },
    { id: 'private-messages', emoji: '💬', nameKey: 'fbFeatPrivateMessages', descKey: 'fbDescPrivateMessages', longDescKey: 'fbLongPrivateMessages', status: 'available' },
    { id: 'feed', emoji: '📰', nameKey: 'fbFeatFeed', descKey: 'fbDescFeed', longDescKey: 'fbLongFeed', status: 'available' },
    { id: 'companion-route', emoji: '🤝', nameKey: 'fbFeatCompanionRoute', descKey: 'fbDescCompanionRoute', longDescKey: 'fbLongCompanionRoute', status: 'available' },
    { id: 'events', emoji: '🎉', nameKey: 'fbFeatEvents', descKey: 'fbDescEvents', longDescKey: 'fbLongEvents', status: 'coming' },
    { id: 'groups-races', emoji: '👥', nameKey: 'fbFeatGroupsRaces', descKey: 'fbDescGroupsRaces', longDescKey: 'fbLongGroupsRaces', status: 'coming' },
  ],
  profil: [
    { id: 'my-profile', emoji: '👤', nameKey: 'fbFeatMyProfile', descKey: 'fbDescMyProfile', longDescKey: 'fbLongMyProfile', status: 'available' },
    { id: 'identity-verify', emoji: '🔐', nameKey: 'fbFeatIdentityVerify', descKey: 'fbDescIdentityVerify', longDescKey: 'fbLongIdentityVerify', status: 'available' },
    { id: 'settings', emoji: '⚙️', nameKey: 'fbFeatSettings', descKey: 'fbDescSettings', longDescKey: 'fbLongSettings', status: 'available' },
    { id: 'thumbs-partners', emoji: '👍', nameKey: 'fbFeatThumbsPartners', descKey: 'fbDescThumbsPartners', longDescKey: 'fbLongThumbsPartners', status: 'coming' },
    { id: 'tech-improvements', emoji: '🚀', nameKey: 'fbFeatTechImprovements', descKey: 'fbDescTechImprovements', longDescKey: 'fbLongTechImprovements', status: 'coming' },
  ],
  securite: [
    { id: 'sos', emoji: '🆘', nameKey: 'fbFeatSos', descKey: 'fbDescSos', longDescKey: 'fbLongSos', status: 'available' },
    { id: 'companion-safety', emoji: '🛡️', nameKey: 'fbFeatCompanionSafety', descKey: 'fbDescCompanionSafety', longDescKey: 'fbLongCompanionSafety', status: 'available' },
    { id: 'guardian-mode', emoji: '👁️', nameKey: 'fbFeatGuardianMode', descKey: 'fbDescGuardianMode', longDescKey: 'fbLongGuardianMode', status: 'coming' },
  ],
}

const TABS = [
  { id: 'carte', emoji: '🗺️', labelKey: 'fbTabCarte' },
  { id: 'voyage', emoji: '🧭', labelKey: 'fbTabVoyage' },
  { id: 'social', emoji: '👥', labelKey: 'fbTabSocial' },
  { id: 'profil', emoji: '👤', labelKey: 'fbTabProfil' },
  { id: 'securite', emoji: '🛡️', labelKey: 'fbTabSecurite' },
]

const REACTIONS = [
  { type: 'like', emoji: '👍', labelKey: 'fbReactLike', selBorder: '#22c55e', selBg: 'rgba(34,197,94,0.08)', tagBg: 'rgba(34,197,94,0.12)', tagColor: '#22c55e' },
  { type: 'love', emoji: '❤️', labelKey: 'fbReactLove', selBorder: '#ec4899', selBg: 'rgba(236,72,153,0.08)', tagBg: 'rgba(236,72,153,0.12)', tagColor: '#ec4899' },
  { type: 'bug', emoji: '🐛', labelKey: 'fbReactBug', selBorder: '#ef4444', selBg: 'rgba(239,68,68,0.08)', tagBg: 'rgba(239,68,68,0.12)', tagColor: '#ef4444' },
  { type: 'idea', emoji: '💡', labelKey: 'fbReactIdea', selBorder: '#f59e0b', selBg: 'rgba(245,158,11,0.08)', tagBg: 'rgba(245,158,11,0.12)', tagColor: '#f59e0b' },
  { type: 'question', emoji: '❓', labelKey: 'fbReactQuestion', selBorder: '#6366f1', selBg: 'rgba(99,102,241,0.08)', tagBg: 'rgba(99,102,241,0.12)', tagColor: '#6366f1' },
]

// ==================== STORAGE HELPERS ====================

function getReviewedIds() {
  try {
    return JSON.parse(localStorage.getItem('spothitch_feedback_reviewed') || '[]')
  } catch { return [] }
}

function setReviewedIds(ids) {
  localStorage.setItem('spothitch_feedback_reviewed', JSON.stringify(ids))
}

function getFeedbackData() {
  try {
    return JSON.parse(localStorage.getItem('spothitch_feedback_data') || '[]')
  } catch { return [] }
}

function setFeedbackData(data) {
  localStorage.setItem('spothitch_feedback_data', JSON.stringify(data))
}

// ==================== RENDER HELPERS ====================

function renderFeatureItem(feat, reviewed) {
  const isReviewed = reviewed.includes(feat.id)
  const statusTag = feat.status === 'available'
    ? `<span class="text-[8px] font-bold px-1.5 py-px rounded-md" style="background: rgba(34,197,94,0.12); color: #22c55e">${escapeHTML(t('fbStatusAvailable') || 'Dispo')}</span>`
    : `<span class="text-[8px] font-bold px-1.5 py-px rounded-md" style="background: rgba(245,158,11,0.12); color: #f59e0b">${escapeHTML(t('fbStatusComing') || 'Bientôt')}</span>`

  const checkStyle = isReviewed
    ? 'border: 2px solid #22c55e; background: rgba(34,197,94,0.15); color: #22c55e'
    : 'border: 2px solid rgba(255,255,255,0.1)'

  return `
    <div class="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors relative"
      style="border-bottom: 1px solid rgba(255,255,255,0.03)"
      onclick="openFeedbackDetail('${escapeJSString(feat.id)}')" role="button" tabindex="0">
      <div class="text-xl w-9 h-9 flex items-center justify-center rounded-[10px] shrink-0" style="background: rgba(255,255,255,0.04)">${feat.emoji}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 text-[13px] font-semibold">${escapeHTML(t(feat.nameKey) || feat.id)} ${statusTag}</div>
        <div class="text-[10px] text-slate-400 mt-px">${escapeHTML(t(feat.descKey) || '')}</div>
      </div>
      ${!isReviewed ? '<div class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft shrink-0" style="margin-right: 4px"></div>' : ''}
      <div class="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-[11px] transition-all" style="${checkStyle}">${isReviewed ? '✓' : ''}</div>
    </div>
  `
}

// ==================== MAIN PANEL ====================

export function renderFeedbackPanel(state) {
  const activeTab = state.feedbackActiveTab || 'carte'
  const detailId = state.feedbackDetailFeature

  if (detailId) {
    return renderFeedbackDetail(state, detailId)
  }

  const reviewed = getReviewedIds()
  const allFeatures = Object.values(FEATURES).flat()
  const total = allFeatures.length
  const done = allFeatures.filter(f => reviewed.includes(f.id)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const tabFeatures = FEATURES[activeTab] || []
  const available = tabFeatures.filter(f => f.status === 'available')
  const coming = tabFeatures.filter(f => f.status === 'coming')
  const activeTabObj = TABS.find(tb => tb.id === activeTab)

  return `
    <div class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="fb-panel-title">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeFeedbackPanel()" aria-hidden="true"></div>
      <div class="absolute top-0 right-0 bottom-0 w-[88%] max-w-md overflow-hidden flex flex-col shadow-2xl slide-panel-in" style="z-index: 50; background: #1e293b">

        <!-- Header -->
        <div class="shrink-0 relative" style="padding: 54px 16px 12px; background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))">
          <button onclick="closeFeedbackPanel()" class="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-base" style="top: 50px; background: rgba(255,255,255,0.1)" aria-label="${escapeHTML(t('close') || 'Fermer')}">✕</button>
          <h2 id="fb-panel-title" class="text-lg font-extrabold">${escapeHTML(t('fbTitle') || 'Aide & Feedback')}</h2>
          <p class="text-xs mt-0.5" style="color: #94a3b8">${escapeHTML(t('fbSubtitle') || 'Ton avis nous aide à améliorer l\'app !')}</p>
          <div class="flex items-center gap-2 mt-2.5">
            <div class="flex-1 h-1 rounded-sm overflow-hidden" style="background: rgba(255,255,255,0.1)">
              <div class="h-full rounded-sm transition-all duration-500" style="width: ${pct}%; background: linear-gradient(90deg, #22c55e, #10b981)"></div>
            </div>
            <span class="text-[11px] font-semibold whitespace-nowrap" style="color: #94a3b8">${done}/${total} ${escapeHTML(t('fbProgressText') || 'avis')}</span>
          </div>
        </div>

        <!-- Tab pills -->
        <div class="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0" style="-webkit-overflow-scrolling: touch">
          ${TABS.map(tab => {
            const isActive = tab.id === activeTab
            const tabFeats = FEATURES[tab.id] || []
            const allTabReviewed = tabFeats.every(f => reviewed.includes(f.id))
            const hasUnreviewed = tabFeats.some(f => !reviewed.includes(f.id))
            const selStyle = isActive
              ? 'background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b'
              : 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8'
            return `
              <button onclick="setFeedbackTab('${tab.id}')"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 relative transition-all cursor-pointer"
                style="${selStyle}"
                aria-pressed="${isActive}">
                ${tab.emoji} ${escapeHTML(t(tab.labelKey) || tab.id)}
                ${hasUnreviewed && !allTabReviewed ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft"></span>' : ''}
                ${allTabReviewed ? '<span class="text-[10px]">✓</span>' : ''}
              </button>
            `
          }).join('')}
        </div>

        <!-- Feature list -->
        <div class="flex-1 overflow-y-auto pb-5">
          ${available.length > 0 ? `
            <div class="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1.5" style="color: #64748b; letter-spacing: 1.5px">✅ ${escapeHTML(t('fbSectionAvailable') || 'Disponible')}</div>
            ${available.map(feat => renderFeatureItem(feat, reviewed)).join('')}
          ` : ''}
          ${coming.length > 0 ? `
            <div class="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1.5" style="color: #64748b; letter-spacing: 1.5px">🔜 ${escapeHTML(t('fbSectionComing') || 'À venir')}</div>
            ${coming.map(feat => renderFeatureItem(feat, reviewed)).join('')}
          ` : ''}

          <div class="mx-4 mt-4 mb-2 p-3.5 rounded-xl text-center cursor-pointer"
            style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06)); border: 1px dashed rgba(99,102,241,0.2)"
            onclick="openFeedbackDetail('general-${activeTab}')" role="button" tabindex="0">
            <span class="text-[13px] font-semibold" style="color: #a5b4fc">💬 ${escapeHTML(t('fbGeneralFeedback') || 'Avis général sur')} ${escapeHTML(t(activeTabObj?.labelKey) || activeTab)}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

// ==================== DETAIL VIEW ====================

function renderFeedbackDetail(state, featureId) {
  const allFeatures = Object.values(FEATURES).flat()
  const feat = allFeatures.find(f => f.id === featureId)
  const isGeneral = featureId.startsWith('general-')

  const emoji = feat?.emoji || '💬'
  const title = isGeneral
    ? (t('fbGeneralTitle') || 'Avis général')
    : (t(feat?.nameKey) || featureId)
  const desc = isGeneral
    ? (t('fbGeneralDesc') || 'Donne ton avis global sur cet onglet : ce qui te plaît, ce qui manque, ce qui pourrait être mieux.')
    : (t(feat?.longDescKey) || t(feat?.descKey) || '')
  const status = feat?.status || 'available'

  const allFeedback = getFeedbackData()
  const existing = allFeedback.find(f => f.featureId === featureId) || {}
  const selectedReactions = existing.reactions || []

  const statusBadge = isGeneral ? '' : (status === 'available'
    ? `<span class="text-[11px] font-bold px-2.5 py-1 rounded-lg" style="background: rgba(34,197,94,0.12); color: #22c55e">${escapeHTML(t('fbStatusAvailableLong') || 'Disponible')}</span>`
    : `<span class="text-[11px] font-bold px-2.5 py-1 rounded-lg" style="background: rgba(245,158,11,0.12); color: #f59e0b">${escapeHTML(t('fbStatusComingLong') || 'À venir')}</span>`)

  const isDisabled = selectedReactions.length === 0
  const submitOpacity = isDisabled ? '; opacity: 0.3; cursor: default' : ''

  return `
    <div class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="fb-detail-title">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeFeedbackPanel()" aria-hidden="true"></div>
      <div class="absolute top-0 right-0 bottom-0 w-[88%] max-w-md overflow-hidden flex flex-col shadow-2xl slide-panel-in" style="z-index: 60; background: #1e293b">

        <div class="shrink-0 px-4" style="padding-top: 54px; padding-bottom: 16px">
          <button onclick="closeFeedbackDetail()" class="flex items-center gap-1.5 text-[13px] cursor-pointer mb-4" style="color: #94a3b8; background: none; border: none">
            ${escapeHTML(t('fbBack') || '← Retour')}
          </button>
          <div class="flex items-center gap-3">
            <span class="text-[32px]">${isGeneral ? '💬' : emoji}</span>
            <div>
              <h2 id="fb-detail-title" class="text-lg font-extrabold">${escapeHTML(title)}</h2>
              <div class="mt-1">${statusBadge}</div>
            </div>
          </div>
          <p class="text-[13px] mt-3 leading-relaxed px-1" style="color: #94a3b8">${escapeHTML(desc)}</p>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-8">
          <div class="text-[13px] font-bold mt-5 mb-2.5" style="color: #e2e8f0">${escapeHTML(t('fbReactTitle') || 'Ton avis (choix multiples)')}</div>

          <div class="flex flex-wrap gap-2">
            ${REACTIONS.map((r, i) => {
              const isSel = selectedReactions.includes(r.type)
              const chipStyle = isSel
                ? `border: 2px solid ${r.selBorder}; background: ${r.selBg}`
                : 'border: 2px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02)'
              const widthStyle = i === 4 ? 'min-width: 100%' : 'min-width: calc(50% - 4px)'
              return `
                <div onclick="toggleFeedbackReaction('${r.type}')"
                  class="p-3 rounded-xl cursor-pointer text-center transition-all text-white"
                  style="${chipStyle}; flex: 1; ${widthStyle}"
                  role="button" tabindex="0" aria-pressed="${isSel}">
                  <span class="text-[26px] block">${r.emoji}</span>
                  <span class="text-[11px] font-semibold block mt-1">${escapeHTML(t(r.labelKey) || r.type)}</span>
                </div>
              `
            }).join('')}
          </div>

          ${selectedReactions.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${selectedReactions.map(type => {
                const r = REACTIONS.find(rx => rx.type === type)
                if (!r) return ''
                return `<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1" style="background: ${r.tagBg}; color: ${r.tagColor}">${r.emoji} ${escapeHTML(t(r.labelKey) || r.type)}</span>`
              }).join('')}
            </div>
          ` : ''}

          <div class="text-[13px] font-bold mt-5 mb-2.5" style="color: #e2e8f0">${escapeHTML(t('fbCommentTitle') || 'Commentaire (optionnel)')}</div>
          <textarea id="feedback-comment" rows="3"
            placeholder="${escapeHTML(t('fbCommentPlaceholder') || 'Explique ton avis...')}"
            class="w-full p-3 rounded-xl text-sm text-white resize-none"
            style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); min-height: 80px; font-family: inherit"
            maxlength="500">${escapeHTML(existing.comment || '')}</textarea>

          <button onclick="submitFeedback('${escapeJSString(featureId)}')"
            class="w-full py-3.5 rounded-xl text-white text-[15px] font-bold mt-3.5 transition-opacity border-none"
            style="background: linear-gradient(135deg, #6366f1, #818cf8)${submitOpacity}"
            ${isDisabled ? 'disabled' : ''}>
            ${escapeHTML(t('fbSubmit') || 'Envoyer mon avis')}
          </button>
        </div>

        <div id="feedback-success" class="absolute inset-0 items-center justify-center flex-col" style="z-index: 70; background: rgba(30,41,59,0.95); display: none">
          <div class="text-6xl" style="animation: bounceIn 0.5s ease">🎉</div>
          <div class="text-lg font-extrabold mt-4">${escapeHTML(t('fbThanks') || 'Merci pour ton avis !')}</div>
          <div class="text-[13px] mt-1.5" style="color: #94a3b8">${escapeHTML(t('fbThanksDesc') || 'Ça nous aide énormément')}</div>
        </div>
      </div>
    </div>
  `
}

// ==================== HANDLERS ====================

window.setFeedbackTab = (tab) => {
  setState({ feedbackActiveTab: tab })
}

window.openFeedbackDetail = (featureId) => {
  setState({ feedbackDetailFeature: featureId })
}

window.closeFeedbackDetail = () => {
  setState({ feedbackDetailFeature: null })
}

window.toggleFeedbackReaction = (type) => {
  const state = getState()
  const featureId = state.feedbackDetailFeature
  if (!featureId) return

  const allFeedback = getFeedbackData()
  const idx = allFeedback.findIndex(f => f.featureId === featureId)
  const existing = idx >= 0 ? allFeedback[idx] : { featureId, reactions: [], comment: '' }

  const reactions = [...(existing.reactions || [])]
  const rIdx = reactions.indexOf(type)
  if (rIdx >= 0) {
    reactions.splice(rIdx, 1)
  } else {
    reactions.push(type)
  }

  const updated = { ...existing, reactions }
  if (idx >= 0) {
    allFeedback[idx] = updated
  } else {
    allFeedback.push(updated)
  }
  setFeedbackData(allFeedback)

  if (window._forceRender) window._forceRender()
}

window.submitFeedback = async (featureId) => {
  const comment = document.getElementById('feedback-comment')?.value || ''
  const allFeedback = getFeedbackData()
  const idx = allFeedback.findIndex(f => f.featureId === featureId)
  const existing = idx >= 0 ? allFeedback[idx] : { featureId, reactions: [], comment: '' }

  const state = getState()
  const entry = {
    ...existing,
    comment,
    timestamp: new Date().toISOString(),
    lang: state.lang || 'fr',
    userName: state.username || '',
    userId: state.user?.uid || null,
  }

  if (idx >= 0) {
    allFeedback[idx] = entry
  } else {
    allFeedback.push(entry)
  }
  setFeedbackData(allFeedback)

  const reviewed = getReviewedIds()
  if (!reviewed.includes(featureId)) {
    reviewed.push(featureId)
    setReviewedIds(reviewed)
  }

  if (state.user?.uid) {
    try {
      const { getFirestore, collection, addDoc } = await import('firebase/firestore')
      const { getApp } = await import('firebase/app')
      const db = getFirestore(getApp())
      await addDoc(collection(db, 'feedback'), {
        featureId: entry.featureId,
        reactions: entry.reactions,
        comment: entry.comment,
        userId: entry.userId,
        userName: entry.userName,
        lang: entry.lang,
        timestamp: entry.timestamp,
      })
    } catch {
      // Firebase not available — localStorage is enough
    }
  }

  const overlay = document.getElementById('feedback-success')
  if (overlay) overlay.style.display = 'flex'

  setTimeout(() => {
    setState({ feedbackDetailFeature: null })
  }, 1800)

  if (window.showToast) {
    window.showToast(t('fbThanks') || 'Merci !', 'success')
  }
}
