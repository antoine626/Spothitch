/**
 * Feedback Panel — Side sliding panel for user feedback on features
 * 30 features organized by 5 tabs, multi-select reactions, Firebase sync
 */

import { getState, setState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { escapeHTML } from '../../utils/sanitize.js'

// ==================== FEATURE DEFINITIONS ====================
// IDs are stable — never change after deploy (stored in localStorage/Firebase)

const FEATURES = {
  carte: [
    { id: 'map-interactive', emoji: '🗺️', nameKey: 'fbFeatMapInteractive', descKey: 'fbDescMapInteractive', status: 'available' },
    { id: 'map-clustering', emoji: '📍', nameKey: 'fbFeatMapClustering', descKey: 'fbDescMapClustering', status: 'available' },
    { id: 'map-search', emoji: '🔍', nameKey: 'fbFeatMapSearch', descKey: 'fbDescMapSearch', status: 'available' },
    { id: 'map-gps', emoji: '📡', nameKey: 'fbFeatMapGps', descKey: 'fbDescMapGps', status: 'available' },
    { id: 'map-offline', emoji: '📴', nameKey: 'fbFeatMapOffline', descKey: 'fbDescMapOffline', status: 'coming' },
    { id: 'map-filters', emoji: '🎛️', nameKey: 'fbFeatMapFilters', descKey: 'fbDescMapFilters', status: 'available' },
  ],
  voyage: [
    { id: 'trip-planner', emoji: '🧭', nameKey: 'fbFeatTripPlanner', descKey: 'fbDescTripPlanner', status: 'available' },
    { id: 'trip-spots', emoji: '📌', nameKey: 'fbFeatTripSpots', descKey: 'fbDescTripSpots', status: 'available' },
    { id: 'trip-gas', emoji: '⛽', nameKey: 'fbFeatTripGas', descKey: 'fbDescTripGas', status: 'available' },
    { id: 'trip-journal', emoji: '📓', nameKey: 'fbFeatTripJournal', descKey: 'fbDescTripJournal', status: 'coming' },
    { id: 'trip-share', emoji: '🔗', nameKey: 'fbFeatTripShare', descKey: 'fbDescTripShare', status: 'available' },
    { id: 'trip-history', emoji: '📜', nameKey: 'fbFeatTripHistory', descKey: 'fbDescTripHistory', status: 'available' },
  ],
  social: [
    { id: 'social-chat', emoji: '💬', nameKey: 'fbFeatSocialChat', descKey: 'fbDescSocialChat', status: 'available' },
    { id: 'social-friends', emoji: '👥', nameKey: 'fbFeatSocialFriends', descKey: 'fbDescSocialFriends', status: 'available' },
    { id: 'social-groups', emoji: '🏕️', nameKey: 'fbFeatSocialGroups', descKey: 'fbDescSocialGroups', status: 'available' },
    { id: 'social-events', emoji: '📅', nameKey: 'fbFeatSocialEvents', descKey: 'fbDescSocialEvents', status: 'coming' },
    { id: 'social-dm', emoji: '✉️', nameKey: 'fbFeatSocialDm', descKey: 'fbDescSocialDm', status: 'available' },
    { id: 'social-ambassador', emoji: '🏅', nameKey: 'fbFeatSocialAmbassador', descKey: 'fbDescSocialAmbassador', status: 'available' },
  ],
  profil: [
    { id: 'profile-stats', emoji: '📊', nameKey: 'fbFeatProfileStats', descKey: 'fbDescProfileStats', status: 'available' },
    { id: 'profile-badges', emoji: '🏆', nameKey: 'fbFeatProfileBadges', descKey: 'fbDescProfileBadges', status: 'available' },
    { id: 'profile-shop', emoji: '🛒', nameKey: 'fbFeatProfileShop', descKey: 'fbDescProfileShop', status: 'available' },
    { id: 'profile-quiz', emoji: '🧠', nameKey: 'fbFeatProfileQuiz', descKey: 'fbDescProfileQuiz', status: 'available' },
    { id: 'profile-roadmap', emoji: '🗳️', nameKey: 'fbFeatProfileRoadmap', descKey: 'fbDescProfileRoadmap', status: 'available' },
    { id: 'profile-verify', emoji: '✅', nameKey: 'fbFeatProfileVerify', descKey: 'fbDescProfileVerify', status: 'coming' },
  ],
  securite: [
    { id: 'sec-sos', emoji: '🆘', nameKey: 'fbFeatSecSos', descKey: 'fbDescSecSos', status: 'available' },
    { id: 'sec-companion', emoji: '🛡️', nameKey: 'fbFeatSecCompanion', descKey: 'fbDescSecCompanion', status: 'available' },
    { id: 'sec-guides', emoji: '📖', nameKey: 'fbFeatSecGuides', descKey: 'fbDescSecGuides', status: 'available' },
    { id: 'sec-radar', emoji: '📡', nameKey: 'fbFeatSecRadar', descKey: 'fbDescSecRadar', status: 'coming' },
    { id: 'sec-fakeCall', emoji: '📞', nameKey: 'fbFeatSecFakeCall', descKey: 'fbDescSecFakeCall', status: 'available' },
    { id: 'sec-report', emoji: '🚩', nameKey: 'fbFeatSecReport', descKey: 'fbDescSecReport', status: 'available' },
  ],
}

const TABS = [
  { id: 'carte', emoji: '🗺️', labelKey: 'fbTabCarte' },
  { id: 'voyage', emoji: '🧭', labelKey: 'fbTabVoyage' },
  { id: 'social', emoji: '💬', labelKey: 'fbTabSocial' },
  { id: 'profil', emoji: '👤', labelKey: 'fbTabProfil' },
  { id: 'securite', emoji: '🛡️', labelKey: 'fbTabSecurite' },
]

const REACTIONS = [
  { type: 'like', emoji: '👍', labelKey: 'fbReactLike', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { type: 'love', emoji: '❤️', labelKey: 'fbReactLove', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { type: 'bug', emoji: '🐛', labelKey: 'fbReactBug', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { type: 'idea', emoji: '💡', labelKey: 'fbReactIdea', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { type: 'question', emoji: '❓', labelKey: 'fbReactQuestion', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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

// ==================== RENDER FUNCTIONS ====================

/**
 * Main panel — slides from right, 88% width
 */
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

  return `
    <div class="fixed inset-0 z-50 flex justify-end" onclick="if(event.target===this)closeFeedbackPanel()" role="dialog" aria-modal="true" aria-labelledby="feedback-panel-title">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>
      <div class="relative w-[88%] max-w-md h-full bg-dark-primary border-l border-white/10 shadow-2xl overflow-y-auto slide-left-in">

        <!-- Header -->
        <div class="sticky top-0 z-10 bg-dark-primary/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 id="feedback-panel-title" class="text-lg font-bold flex items-center gap-2">
              ${icon('message-circle', 'w-5 h-5 text-primary-400')}
              ${t('fbTitle') || 'Ton avis compte'}
            </h2>
            <button onclick="closeFeedbackPanel()" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
          <p class="text-xs text-slate-400 mb-3">${t('fbSubtitle') || 'Aide-nous à améliorer SpotHitch'}</p>

          <!-- Progress bar -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-amber-400 transition-all duration-500" style="width:${pct}%"></div>
            </div>
            <span class="text-xs font-medium text-primary-400">${done}/${total}</span>
          </div>
        </div>

        <!-- Tab pills -->
        <div class="flex gap-1.5 p-3 overflow-x-auto no-scrollbar">
          ${TABS.map(tab => {
            const isActive = tab.id === activeTab
            const tabFeats = FEATURES[tab.id] || []
            const hasUnreviewed = tabFeats.some(f => !reviewed.includes(f.id))
            return `
              <button onclick="setFeedbackTab('${tab.id}')"
                class="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                  ${isActive ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}"
                aria-pressed="${isActive}">
                <span>${tab.emoji}</span>
                <span>${t(tab.labelKey) || tab.id}</span>
                ${hasUnreviewed ? '<span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 animate-pulse-soft"></span>' : ''}
              </button>
            `
          }).join('')}
        </div>

        <!-- Feature list -->
        <div class="p-3 space-y-2">
          ${tabFeatures.map(feat => {
            const isReviewed = reviewed.includes(feat.id)
            const statusTag = feat.status === 'available'
              ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">${t('fbStatusAvailable') || 'Dispo'}</span>`
              : `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">${t('fbStatusComing') || 'Bientôt'}</span>`
            return `
              <button onclick="openFeedbackDetail('${feat.id}')"
                class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left border border-transparent hover:border-white/10">
                <span class="text-2xl shrink-0">${feat.emoji}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-sm font-medium truncate">${t(feat.nameKey) || feat.id}</span>
                    ${statusTag}
                  </div>
                  <p class="text-xs text-slate-400 truncate">${t(feat.descKey) || ''}</p>
                </div>
                <div class="shrink-0 flex items-center gap-1.5">
                  ${isReviewed
                    ? `<span class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">${icon('check', 'w-3.5 h-3.5 text-emerald-400')}</span>`
                    : `<span class="w-2 h-2 rounded-full bg-orange-400 animate-pulse-soft"></span>`}
                  ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
                </div>
              </button>
            `
          }).join('')}
        </div>

        <!-- General feedback button -->
        <div class="p-3 pt-0">
          <button onclick="openFeedbackDetail('general-${activeTab}')"
            class="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/20 transition-colors">
            ${icon('message-square', 'w-4 h-4')}
            ${t('fbGeneralFeedback') || 'Avis général sur cet onglet'}
          </button>
        </div>

        <div class="h-8"></div>
      </div>
    </div>
  `
}

/**
 * Detail view — single feature with reactions + comment
 */
function renderFeedbackDetail(state, featureId) {
  const allFeatures = Object.values(FEATURES).flat()
  const feat = allFeatures.find(f => f.id === featureId)

  // General tab feedback
  const isGeneral = featureId.startsWith('general-')

  const emoji = feat?.emoji || '💬'
  const nameKey = feat?.nameKey
  const descKey = feat?.descKey
  const status = feat?.status || 'available'

  const title = isGeneral
    ? (t('fbGeneralTitle') || 'Avis général')
    : (t(nameKey) || featureId)
  const desc = isGeneral
    ? (t('fbGeneralDesc') || 'Donne ton impression sur cet onglet')
    : (t(descKey) || '')

  // Load existing feedback for this feature
  const allFeedback = getFeedbackData()
  const existing = allFeedback.find(f => f.featureId === featureId) || {}
  const selectedReactions = existing.reactions || []

  const statusLabel = status === 'available'
    ? `<span class="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${t('fbStatusAvailable') || 'Disponible'}</span>`
    : `<span class="px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">${t('fbStatusComing') || 'À venir'}</span>`

  return `
    <div class="fixed inset-0 z-50 flex justify-end" onclick="if(event.target===this)closeFeedbackPanel()" role="dialog" aria-modal="true" aria-labelledby="feedback-detail-title">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>
      <div class="relative w-[88%] max-w-md h-full bg-dark-primary border-l border-white/10 shadow-2xl overflow-y-auto slide-left-in">

        <!-- Header -->
        <div class="sticky top-0 z-10 bg-dark-primary/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div class="flex items-center gap-3">
            <button onclick="closeFeedbackDetail()" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0" aria-label="${t('back') || 'Retour'}">
              ${icon('arrow-left', 'w-5 h-5')}
            </button>
            <h2 id="feedback-detail-title" class="text-base font-bold truncate">${escapeHTML(title)}</h2>
          </div>
        </div>

        <div class="p-4 space-y-5">
          <!-- Feature info -->
          <div class="text-center py-4">
            <div class="text-5xl mb-3">${isGeneral ? '💬' : emoji}</div>
            <h3 class="text-lg font-bold mb-1">${escapeHTML(title)}</h3>
            ${!isGeneral ? statusLabel : ''}
            <p class="text-sm text-slate-300 mt-3 leading-relaxed">${escapeHTML(desc)}</p>
          </div>

          <!-- Reactions (multi-select) -->
          <div>
            <h4 class="text-sm font-medium mb-3">${t('fbReactTitle') || 'Ton ressenti'}</h4>
            <div class="flex flex-wrap gap-2">
              ${REACTIONS.map(r => {
                const isSelected = selectedReactions.includes(r.type)
                return `
                  <button onclick="toggleFeedbackReaction('${r.type}')"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all
                      ${isSelected ? r.color + ' border ring-1 ring-current' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}"
                    aria-pressed="${isSelected}">
                    <span>${r.emoji}</span>
                    <span>${t(r.labelKey) || r.type}</span>
                  </button>
                `
              }).join('')}
            </div>
          </div>

          <!-- Comment -->
          <div>
            <label for="feedback-comment" class="text-sm font-medium mb-2 block">${t('fbCommentLabel') || 'Un commentaire ?'}</label>
            <textarea id="feedback-comment" rows="3" maxlength="500"
              placeholder="${t('fbCommentPlaceholder') || 'Ton avis, une idée, un bug...'}"
              class="input-field w-full resize-none text-sm">${escapeHTML(existing.comment || '')}</textarea>
          </div>

          <!-- Submit -->
          <button onclick="submitFeedback('${featureId}')"
            class="w-full py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
            ${icon('send', 'w-4 h-4')}
            ${t('fbSubmit') || 'Envoyer mon avis'}
          </button>

          <!-- Success message (hidden by default, shown via JS) -->
          <div id="feedback-success" class="hidden text-center py-6">
            <div class="text-5xl mb-2">🎉</div>
            <p class="text-lg font-bold">${t('fbThanks') || 'Merci !'}</p>
            <p class="text-sm text-slate-400 mt-1">${t('fbThanksDesc') || 'Ton avis aide à améliorer SpotHitch'}</p>
          </div>
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

  // Force re-render to update button states
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

  // Mark as reviewed
  const reviewed = getReviewedIds()
  if (!reviewed.includes(featureId)) {
    reviewed.push(featureId)
    setReviewedIds(reviewed)
  }

  // Firebase async save (best-effort)
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

  // Show success animation
  const submitBtn = document.querySelector('[onclick*="submitFeedback"]')
  const successEl = document.getElementById('feedback-success')
  if (submitBtn) submitBtn.style.display = 'none'
  if (successEl) successEl.classList.remove('hidden')

  // Auto-close detail after 1.5s
  setTimeout(() => {
    setState({ feedbackDetailFeature: null })
  }, 1500)

  // Toast
  if (window.showToast) {
    window.showToast(t('fbThanks') || 'Merci !', 'success')
  }
}
